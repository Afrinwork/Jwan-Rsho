import { collection, deleteField, doc, getDoc, onSnapshot, query, runTransaction, setDoc, updateDoc, where } from "firebase/firestore";
import { ref as storageRef, uploadBytes } from "firebase/storage";

import { mapSnapshot, requireDb, requireStorage, resolveOwnerScope } from "@/src/repositories/repositoryContext.firebase";
import { DriverCheckIn } from "@/src/types/driverCheckIn";
import { getBerlinDateKey, isPastMorningWindow } from "@/src/utils/time/europeBerlin";

const MAX_ATTEMPTS = 3;

export type CheckInAttemptFailureReason =
  | "permission_denied"
  | "photo_cancelled"
  | "submit_failed"
  | "left_flow"
  | "gps_imprecise";

function todayCheckInId(driverId: string) {
  return `${driverId}_${getBerlinDateKey(new Date())}`;
}

export const driverCheckInRepository = {
  // Reads the driver's own check-in doc for today, without creating one —
  // the doc only comes into existence on the first recordAttemptFailure() or
  // submitCheckIn() call, same as driverCompletionStats only appearing on
  // first recordCompletion().
  async getTodayCheckIn(): Promise<DriverCheckIn> {
    const { ownerId, driverId } = resolveOwnerScope();

    if (!driverId) {
      throw new Error("getTodayCheckIn() is only meaningful for a driver.");
    }

    const date = getBerlinDateKey(new Date());
    const id = todayCheckInId(driverId);
    const snapshot = await getDoc(doc(requireDb(), "driverCheckIns", id));

    if (snapshot.exists()) {
      return mapSnapshot<DriverCheckIn>(snapshot);
    }

    const timestamp = new Date().toISOString();
    return {
      id,
      ownerId,
      driverId,
      date,
      status: "pending",
      attempts: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  },

  // reason is accepted purely so every call site documents why an attempt
  // failed — the individual reason isn't persisted (only the resulting
  // attempts count / blockedReason:"max_attempts" is), matching the current
  // data model.
  async recordAttemptFailure(reason: CheckInAttemptFailureReason) {
    void reason;
    const { ownerId, driverId } = resolveOwnerScope();

    if (!driverId) {
      throw new Error("recordAttemptFailure() is only meaningful for a driver.");
    }

    const db = requireDb();
    const date = getBerlinDateKey(new Date());
    const ref = doc(db, "driverCheckIns", todayCheckInId(driverId));
    const timestamp = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      const isSameDay = snapshot.exists() && snapshot.data().date === date;
      const currentAttempts = isSameDay ? (snapshot.data().attempts as number) : 0;
      const nextAttempts = currentAttempts + 1;
      const blocked = nextAttempts >= MAX_ATTEMPTS;

      transaction.set(ref, {
        ownerId,
        driverId,
        date,
        status: blocked ? "blocked" : "pending",
        ...(blocked ? { blockedReason: "max_attempts" } : {}),
        attempts: nextAttempts,
        createdAt: isSameDay ? snapshot.data().createdAt : timestamp,
        updatedAt: timestamp,
      });
    });
  },

  // Uploads the photo to Storage FIRST, then writes the Firestore doc with
  // status:"ok" — a failed upload must never leave a doc claiming success
  // with a photoStoragePath pointing at nothing.
  async submitCheckIn(input: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
    odometerKm?: number;
    photoUri: string;
  }) {
    const { ownerId, driverId } = resolveOwnerScope();

    if (!driverId) {
      throw new Error("submitCheckIn() is only meaningful for a driver.");
    }

    const date = getBerlinDateKey(new Date());
    const photoStoragePath = `driverCheckIns/${ownerId}/${driverId}/${date}.jpg`;

    const response = await fetch(input.photoUri);
    const blob = await response.blob();
    await uploadBytes(storageRef(requireStorage(), photoStoragePath), blob, { contentType: "image/jpeg" });

    const db = requireDb();
    const ref = doc(db, "driverCheckIns", todayCheckInId(driverId));
    const timestamp = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      const isSameDay = snapshot.exists() && snapshot.data().date === date;

      transaction.set(ref, {
        ownerId,
        driverId,
        date,
        status: "ok",
        attempts: isSameDay ? (snapshot.data().attempts as number) : 0,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        gpsAccuracy: input.accuracy,
        ...(Number.isFinite(input.odometerKm) ? { odometerKm: input.odometerKm } : {}),
        photoStoragePath,
        completedAt: timestamp,
        createdAt: isSameDay ? snapshot.data().createdAt : timestamp,
        updatedAt: timestamp,
      });
    });
  },

  // The required daily report deliberately keeps the odometer as a numeric
  // text value. A photo is not part of the morning requirement.
  async submitDailyStatus(input: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
    odometerKm: number;
  }) {
    const { ownerId, driverId } = resolveOwnerScope();
    if (!driverId) throw new Error("submitDailyStatus() is only meaningful for a driver.");
    if (!Number.isFinite(input.odometerKm) || input.odometerKm < 0) {
      throw new Error("A valid odometer reading is required.");
    }

    const now = new Date();
    const date = getBerlinDateKey(now);
    const db = requireDb();
    const ref = doc(db, "driverCheckIns", todayCheckInId(driverId));
    const timestamp = now.toISOString();

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      const previous = snapshot.exists() ? snapshot.data() : null;
      if (previous?.status === "blocked") {
        throw new Error("Your manager must release your account before you can submit a report.");
      }
      if (isPastMorningWindow(now) && !snapshot.exists()) {
        throw new Error("The daily report deadline has passed. Please contact your manager.");
      }

      transaction.set(ref, {
        ownerId,
        driverId,
        date,
        status: "ok",
        ...(previous?.blockedReason ? { blockedReason: deleteField() } : {}),
        attempts: previous?.attempts ?? 0,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        gpsAccuracy: input.accuracy,
        odometerKm: input.odometerKm,
        completedAt: timestamp,
        createdAt: previous?.createdAt ?? timestamp,
        updatedAt: timestamp,
      });
    });
  },

  // Live view for the admin dashboard (Stage 3) — every one of the caller's
  // own drivers' check-in docs for a given Berlin date, mirroring
  // driverStatsRepository.subscribeToOwnDriverStats.
  // A voluntary position update never changes the check-in status, its photo,
  // or an admin block. It only keeps the manager dashboard current.
  async reportLiveStatus(input: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
    odometerKm?: number;
  }) {
    const { ownerId, driverId } = resolveOwnerScope();
    if (!driverId) throw new Error("reportLiveStatus() is only meaningful for a driver.");

    const date = getBerlinDateKey(new Date());
    const ref = doc(requireDb(), "driverCheckIns", todayCheckInId(driverId));
    const snapshot = await getDoc(ref);
    const timestamp = new Date().toISOString();
    const location = {
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      gpsAccuracy: input.accuracy,
      ...(Number.isFinite(input.odometerKm) ? { odometerKm: input.odometerKm } : {}),
      updatedAt: timestamp,
    };

    if (snapshot.exists()) {
      await updateDoc(ref, location);
      return;
    }

    await setDoc(ref, {
      ownerId,
      driverId,
      date,
      status: "pending",
      attempts: 0,
      ...location,
      createdAt: timestamp,
    });
  },

  subscribeToOwnDriverCheckIns(date: string, onChange: (checkIns: DriverCheckIn[]) => void, onError: (error: unknown) => void) {
    const { ownerId } = resolveOwnerScope();
    const checkInsQuery = query(
      collection(requireDb(), "driverCheckIns"),
      where("ownerId", "==", ownerId),
      where("date", "==", date),
    );
    return onSnapshot(
      checkInsQuery,
      (snapshot) => onChange(snapshot.docs.map((value) => mapSnapshot<DriverCheckIn>(value))),
      onError,
    );
  },
};

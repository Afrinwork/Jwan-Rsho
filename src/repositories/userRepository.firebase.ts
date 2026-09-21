import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";

import { db } from "@/src/firebase/firestore";
import { mapSnapshot, requireCurrentUserId, requireDb } from "@/src/repositories/repositoryContext.firebase";
import { UserProfile } from "@/src/types/user";

export const userRepository = {
  async getUserProfile(uid: string) {
    if (!db) {
      return null;
    }

    const snapshot = await getDoc(doc(db, "users", uid));
    return snapshot.exists()
      ? ({ id: snapshot.id, ...snapshot.data() } as UserProfile)
      : null;
  },

  async updateOwnProfile(input: { fullName: string; email?: string }) {
    if (!db) {
      return;
    }

    const ownerId = requireCurrentUserId();
    await updateDoc(doc(db, "users", ownerId), {
      fullName: input.fullName.trim(),
      ...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
    });
  },

  // Drivers created by the current admin/super_admin — used to populate the
  // driver-assignment picker and the driver dashboard. Firestore rules only
  // allow this for a manager querying by their own uid (see
  // firestore.rules), so this never leaks another manager's drivers.
  async getOwnDrivers() {
    return getOwnUsersByRole("driver");
  },

  // Admins created by the current super_admin — used by the admin dashboard.
  // Same manager-scoped rule as getOwnDrivers(); a plain admin's own query
  // here would just come back empty since they never create other admins.
  async getOwnAdmins() {
    return getOwnUsersByRole("admin");
  },
};

async function getOwnUsersByRole(role: "admin" | "driver") {
  const managerId = requireCurrentUserId();
  const usersQuery = query(collection(requireDb(), "users"), where("managerId", "==", managerId), where("role", "==", role));
  const users = (await getDocs(usersQuery)).docs.map((value) => mapSnapshot<UserProfile>(value));
  return [...users].sort((left, right) => left.fullName.localeCompare(right.fullName, "de"));
}

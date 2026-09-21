import { QueryDocumentSnapshot } from "firebase/firestore";

import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";
import { auth } from "@/src/firebase/auth";
import { db } from "@/src/firebase/firestore";
import { storage } from "@/src/firebase/storage";
import { useAuthStore } from "@/src/store/authStore";

export function requireDb() {
  if (!db) {
    throw new AppError(errorMessages.firebaseNotConfigured);
  }

  return db;
}

export function requireStorage() {
  if (!storage) {
    throw new AppError(errorMessages.firebaseNotConfigured);
  }

  return storage;
}

export function requireCurrentUserId() {
  const uid = auth?.currentUser?.uid;

  if (!uid) {
    throw new AppError(errorMessages.authRequired, "auth/unauthenticated");
  }

  return uid;
}

export type OwnerScope = {
  ownerId: string;
  driverId?: string;
};

// Customer/order data belongs to a super_admin or admin (ownerId == their own
// uid, unchanged from before roles existed). A driver never owns data - they
// only see their manager's data that's been assigned to them - so for a
// driver ownerId resolves to their manager's uid instead of their own.
// Reaches into the Zustand store singleton the same way requireCurrentUserId()
// already reaches into the Firebase Auth singleton.
export function resolveOwnerScope(): OwnerScope {
  const user = useAuthStore.getState().currentUser;

  if (!user) {
    throw new AppError(errorMessages.authRequired, "auth/unauthenticated");
  }

  if (user.role === "driver") {
    if (!user.managerId) {
      throw new AppError(errorMessages.authRequired, "auth/invalid-role-config");
    }

    return { ownerId: user.managerId, driverId: user.uid };
  }

  return { ownerId: user.uid };
}

export function mapSnapshot<T>(snapshot: QueryDocumentSnapshot) {
  return { id: snapshot.id, ...snapshot.data() } as T;
}

import { QueryDocumentSnapshot } from "firebase/firestore";

import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";
import { auth } from "@/src/firebase/auth";
import { db } from "@/src/firebase/firestore";

export function requireDb() {
  if (!db) {
    throw new AppError(errorMessages.firebaseNotConfigured);
  }

  return db;
}

export function requireCurrentUserId() {
  const uid = auth?.currentUser?.uid;

  if (!uid) {
    throw new AppError(errorMessages.authRequired, "auth/unauthenticated");
  }

  return uid;
}

export function mapSnapshot<T>(snapshot: QueryDocumentSnapshot) {
  return { id: snapshot.id, ...snapshot.data() } as T;
}

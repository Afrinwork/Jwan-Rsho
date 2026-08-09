import { FirebaseError } from "firebase/app";

import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";

const firebaseMessageMap: Record<string, string> = {
  "auth/invalid-credential": errorMessages.invalidCredentials,
  "auth/user-not-found": errorMessages.invalidCredentials,
  "auth/wrong-password": errorMessages.invalidCredentials,
  "auth/email-already-in-use": errorMessages.emailAlreadyExists,
  "auth/network-request-failed": errorMessages.noInternet,
  "auth/too-many-requests": errorMessages.authTemporarilyLocked,
  "auth/requires-recent-login": errorMessages.recentLoginRequired,
  "auth/unauthenticated": errorMessages.authRequired,
  "permission-denied": errorMessages.forbidden,
  "failed-precondition": errorMessages.dataLoadFailed,
  "unavailable": errorMessages.dataLoadFailed,
  "deadline-exceeded": errorMessages.dataLoadFailed,
  "cancelled": errorMessages.dataLoadFailed,
  "not-found": errorMessages.dataNotFound,
  "functions/already-exists": errorMessages.emailAlreadyExists,
  "functions/not-found": errorMessages.userNotFound,
  "functions/failed-precondition": errorMessages.adminSelfDelete,
  "functions/permission-denied": errorMessages.forbidden,
  "functions/unavailable": errorMessages.cloudUnavailable,
  "functions/invalid-argument": errorMessages.invalidForm,
  "functions/internal": errorMessages.cloudUnavailable,
};

export function formatError(error: unknown): AppError {
  if (typeof __DEV__ === "undefined" || __DEV__) {
    console.error("[formatError] raw error:", error);
  }

  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof FirebaseError) {
    return new AppError(
      firebaseMessageMap[error.code] ?? errorMessages.generic,
      error.code,
    );
  }

  return new AppError();
}

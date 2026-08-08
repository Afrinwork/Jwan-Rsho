import { FirebaseError } from "firebase/app";

import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";

const firebaseMessageMap: Record<string, string> = {
  "auth/invalid-credential": errorMessages.invalidCredentials,
  "auth/user-not-found": errorMessages.invalidCredentials,
  "auth/wrong-password": errorMessages.invalidCredentials,
};

export function formatError(error: unknown): AppError {
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

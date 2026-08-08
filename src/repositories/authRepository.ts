import {
  User as FirebaseUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";
import { auth } from "@/src/firebase/auth";

export const authRepository = {
  async login(email: string, password: string) {
    if (!auth) {
      throw new AppError(errorMessages.firebaseNotConfigured);
    }

    return signInWithEmailAndPassword(auth, email, password);
  },

  async logout() {
    if (!auth) {
      return;
    }

    await signOut(auth);
  },

  async resetPassword(email: string) {
    if (!auth) {
      throw new AppError(errorMessages.firebaseNotConfigured);
    }

    await sendPasswordResetEmail(auth, email);
  },

  observeAuth(callback: (user: FirebaseUser | null) => void) {
    if (!auth) {
      callback(null);
      return () => undefined;
    }

    return onAuthStateChanged(auth, callback);
  },
};

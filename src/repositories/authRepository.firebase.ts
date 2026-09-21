import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
} from "firebase/auth";

import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";
import { auth } from "@/src/firebase/auth";
import { AuthUser } from "@/src/types/authUser";

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

  async updateEmail(nextEmail: string) {
    if (!auth) {
      throw new AppError(errorMessages.firebaseNotConfigured);
    }

    if (!auth.currentUser) {
      throw new AppError(errorMessages.authRequired, "auth/unauthenticated");
    }

    await updateEmail(auth.currentUser, nextEmail.trim().toLowerCase());
  },

  async updatePassword(nextPassword: string) {
    if (!auth) {
      throw new AppError(errorMessages.firebaseNotConfigured);
    }

    if (!auth.currentUser) {
      throw new AppError(errorMessages.authRequired, "auth/unauthenticated");
    }

    await updatePassword(auth.currentUser, nextPassword);
  },

  // Waits for the ID token to be attached before invoking the normalized
  // callback -- screens mount as soon as authLoading flips false and
  // immediately fire several parallel Firestore reads (overview stats,
  // map customers). Right after a cold start those can race the ID
  // token still being attached to the SDK's credential provider and
  // come back "permission-denied" even though the user is genuinely
  // signed in. This used to live in useAuthSession.ts itself; moved
  // here so that hook can stay backend-agnostic (Supabase's client has
  // no equivalent race to guard against).
  observeAuth(callback: (user: AuthUser | null) => void) {
    if (!auth) {
      callback(null);
      return () => undefined;
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }

      await firebaseUser.getIdToken();
      callback({ uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName });
    });
  },
};

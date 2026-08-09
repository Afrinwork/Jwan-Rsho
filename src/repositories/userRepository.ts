import { doc, getDoc, updateDoc } from "firebase/firestore";

import { db } from "@/src/firebase/firestore";
import { requireCurrentUserId } from "@/src/repositories/repositoryContext";
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
};

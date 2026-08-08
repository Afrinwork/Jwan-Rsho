import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "@/src/firebase/firestore";
import { requireCurrentUserId } from "@/src/repositories/repositoryContext";
import { UserPreferences } from "@/src/types/userPreferences";

export const userPreferencesRepository = {
  async getPreferences() {
    if (!db) {
      return null;
    }

    const ownerId = requireCurrentUserId();
    const snapshot = await getDoc(doc(db, "userPreferences", ownerId));
    return snapshot.exists()
      ? ({ id: snapshot.id, ...snapshot.data() } as UserPreferences)
      : null;
  },

  async savePreferences(input: Omit<UserPreferences, "id" | "createdAt" | "updatedAt">) {
    if (!db) {
      return;
    }

    const ownerId = requireCurrentUserId();
    const timestamp = new Date().toISOString();

    await setDoc(
      doc(db, "userPreferences", ownerId),
      {
        ...input,
        ownerId,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      { merge: true },
    );
  },
};

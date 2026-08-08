import { collection, doc, getCountFromServer, getDoc, query, where } from "firebase/firestore";

import { db } from "@/src/firebase/firestore";
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

  async countActiveUsers() {
    if (!db) {
      return 0;
    }

    const activeUsersQuery = query(
      collection(db, "users"),
      where("isActive", "==", true),
    );
    const snapshot = await getCountFromServer(activeUsersQuery);
    return snapshot.data().count;
  },
};

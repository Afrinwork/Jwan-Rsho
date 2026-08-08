import { getFirestore } from "firebase/firestore";

import { firebaseApp } from "@/src/firebase/config";

export const db = firebaseApp ? getFirestore(firebaseApp) : null;

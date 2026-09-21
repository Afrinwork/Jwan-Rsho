import { getStorage } from "firebase/storage";

import { firebaseApp } from "@/src/firebase/config";

export const storage = firebaseApp ? getStorage(firebaseApp) : null;

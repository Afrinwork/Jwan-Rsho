import { getApp, getApps, initializeApp } from "firebase/app";

import { firebaseEnv, isFirebaseConfigured } from "@/src/config/env";

export const firebaseApp = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseEnv)
  : null;

import { Platform } from "react-native";
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  memoryLruGarbageCollector,
  persistentLocalCache,
  persistentSingleTabManager,
} from "firebase/firestore";

import { firebaseApp } from "@/src/firebase/config";

const nativeFirestoreSettings = {
  // React Native's Firebase JS SDK does not have stable IndexedDB-backed
  // persistence, so we keep the supported LRU memory cache explicitly enabled.
  localCache: memoryLocalCache({
    garbageCollector: memoryLruGarbageCollector(),
  }),
};

const webFirestoreSettings = {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager(undefined),
  }),
};

export const db = firebaseApp
  ? (() => {
      try {
        return initializeFirestore(firebaseApp, Platform.OS === "web" ? webFirestoreSettings : nativeFirestoreSettings);
      } catch {
        return getFirestore(firebaseApp);
      }
    })()
  : null;

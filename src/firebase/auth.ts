import { getAuth, getReactNativePersistence, initializeAuth } from "@firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { firebaseApp } from "@/src/firebase/config";

export const auth = firebaseApp
  ? (() => {
      try {
        return initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) });
      } catch {
        return getAuth(firebaseApp);
      }
    })()
  : null;

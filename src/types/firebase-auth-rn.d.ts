declare module "@firebase/auth/dist/rn/index.js" {
  import AsyncStorage from "@react-native-async-storage/async-storage";
  import { FirebaseApp } from "firebase/app";
  import { Auth, Dependencies, Persistence } from "firebase/auth";

  export function getAuth(app?: FirebaseApp): Auth;
  export function initializeAuth(app: FirebaseApp, deps?: Dependencies): Auth;
  export function getReactNativePersistence(
    storage: typeof AsyncStorage,
  ): Persistence;
}

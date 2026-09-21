import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Usage: set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service account
// JSON key path (Firebase Console -> Project Settings -> Service Accounts
// -> Generate new private key) before running any script that imports
// this module. Never commit that key file -- keep it outside the repo or
// add it to .gitignore explicitly if it must live locally.
export function getFirestoreAdmin() {
  if (getApps().length === 0) {
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!keyPath) {
      throw new Error(
        "GOOGLE_APPLICATION_CREDENTIALS is not set. Point it at a Firebase " +
          "service account JSON key before running migration scripts.",
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require(keyPath);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

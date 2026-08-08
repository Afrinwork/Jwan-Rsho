import { HttpsError } from "firebase-functions/v2/https";

export function requireAuthenticated(request: { auth?: unknown }) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
}

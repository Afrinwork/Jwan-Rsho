import { CallableRequest, HttpsError } from "firebase-functions/v2/https";

export function requireAdmin(request: CallableRequest) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  if (request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin access required.");
  }
}

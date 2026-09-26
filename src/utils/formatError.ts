import { PostgrestError, StorageApiError } from "@supabase/supabase-js";

import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";

const postgrestCodeMap: Record<string, string> = {
  PGRST116: errorMessages.dataNotFound,
  "23505": errorMessages.duplicateProduct,
  "42501": errorMessages.forbidden,
  // Undefined column/table — the app is newer than the database schema
  // (a migration hasn't been applied yet). Retrying never helps here.
  "42703": errorMessages.databaseOutdated,
  "42P01": errorMessages.databaseOutdated,
  PGRST204: errorMessages.databaseOutdated,
  PGRST205: errorMessages.databaseOutdated,
};

const postgrestMessageMap: Record<string, string> = {
  "order-already-exists": errorMessages.generic,
  "customer-not-found": errorMessages.dataNotFound,
  "order-not-found": errorMessages.dataNotFound,
  "not-found": errorMessages.dataNotFound,
  "cannot-target-self": errorMessages.forbidden,
  "permission-denied": errorMessages.forbidden,
};

const authMessageMap: Record<string, string> = {
  invalid_credentials: errorMessages.invalidCredentials,
  email_exists: errorMessages.emailAlreadyExists,
  user_already_exists: errorMessages.emailAlreadyExists,
  weak_password: errorMessages.invalidForm,
  over_request_rate_limit: errorMessages.authTemporarilyLocked,
  over_email_send_rate_limit: errorMessages.authTemporarilyLocked,
  session_expired: errorMessages.authRequired,
  session_not_found: errorMessages.authRequired,
  refresh_token_not_found: errorMessages.authRequired,
  refresh_token_already_used: errorMessages.authRequired,
};

function isAuthError(error: unknown): error is { code?: string; message: string } {
  return typeof error === "object" && error !== null && "__isAuthError" in error;
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && /network|fetch/i.test(error.message);
}

export function formatError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof PostgrestError) {
    const message = postgrestMessageMap[error.message] ?? postgrestCodeMap[error.code] ?? errorMessages.generic;
    return new AppError(message, error.code || error.message);
  }

  if (error instanceof StorageApiError) {
    return new AppError(errorMessages.cloudUnavailable, String(error.status ?? "storage-error"));
  }

  if (isAuthError(error)) {
    return new AppError(authMessageMap[error.code ?? ""] ?? errorMessages.invalidCredentials, error.code ?? "auth-error");
  }

  if (isNetworkError(error)) return new AppError(errorMessages.noInternet, "network-error");
  return new AppError();
}

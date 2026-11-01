import test from "node:test";
import assert from "node:assert/strict";
import { AuthApiError, AuthRetryableFetchError, PostgrestError } from "@supabase/supabase-js";

import { errorMessages } from "@/src/errors/errorMessages";
import { formatError } from "@/src/utils/formatError";

test("Error State: unexpected errors are hidden behind a friendly message", () => {
  const result = formatError(new Error("Customer not found."));
  assert.equal(result.message, errorMessages.generic);
});

test("Error State: non-error values are also hidden behind a friendly message", () => {
  const result = formatError("raw firestore failure string");
  assert.equal(result.message, errorMessages.generic);
});

function postgrestError(code: string, message = "db error") {
  return new PostgrestError({ code, message, details: "", hint: "" });
}

test("Netzwerkfehler: a failed fetch is translated", () => {
  const result = formatError(new TypeError("Network request failed"));
  assert.equal(result.message, errorMessages.noInternet);
});

test("Datenbank Fehler: RLS permission-denied (42501) is translated, not generic", () => {
  assert.equal(formatError(postgrestError("42501")).message, errorMessages.forbidden);
});

test("Datenbank Fehler: a schema behind the app (missing column/table) says so instead of 'try again'", () => {
  assert.equal(formatError(postgrestError("42703")).message, errorMessages.databaseOutdated);
  assert.equal(formatError(postgrestError("PGRST205")).message, errorMessages.databaseOutdated);
});

test("Login: wrong password, blocked account and no connection each say what happened", () => {
  assert.equal(formatError(new AuthApiError("Invalid login credentials", 400, "invalid_credentials")).message, errorMessages.invalidCredentials);
  assert.equal(formatError(new AuthApiError("User is banned", 400, "user_banned")).message, errorMessages.accountBlocked);
  assert.equal(formatError(new AuthRetryableFetchError("Failed to fetch", 0)).message, errorMessages.noInternet);
  // An auth error nobody mapped is not reported as a wrong password.
  assert.equal(formatError(new AuthApiError("Something else", 500, "unexpected_failure")).message, errorMessages.generic);
});

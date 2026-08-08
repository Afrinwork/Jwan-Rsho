import test from "node:test";
import assert from "node:assert/strict";
import { FirebaseError } from "firebase/app";

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

test("Netzwerkfehler: auth offline error is translated", () => {
  const result = formatError(new FirebaseError("auth/network-request-failed", "offline"));
  assert.equal(result.message, errorMessages.noInternet);
});

test("Netzwerkfehler: firestore unavailable is translated", () => {
  const result = formatError(new FirebaseError("firestore/unavailable", "unavailable"));
  assert.equal(result.message, errorMessages.dataLoadFailed);
});

test("Cloud Function Fehler: internal function error is translated", () => {
  const result = formatError(new FirebaseError("functions/internal", "internal"));
  assert.equal(result.message, errorMessages.cloudUnavailable);
});

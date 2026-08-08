import test from "node:test";
import assert from "node:assert/strict";

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

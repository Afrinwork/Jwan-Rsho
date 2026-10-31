import test from "node:test";
import assert from "node:assert/strict";

import { emailSchema } from "@/src/validation/commonSchemas";

test("emailSchema accepts an email with the space and capital letter an Android keyboard adds", () => {
  assert.equal(emailSchema.parse(" Fahrer@Example.com "), "fahrer@example.com");
});

test("emailSchema still rejects what isn't an email", () => {
  assert.equal(emailSchema.safeParse("fahrer").success, false);
  assert.equal(emailSchema.safeParse("   ").success, false);
});

import test from "node:test";
import assert from "node:assert/strict";

import { deleteUserSchema } from "@/src/features/admin/validation/deleteUserSchema";

test("delete user schema accepts valid email", () => {
  const parsed = deleteUserSchema.safeParse({ email: "user@example.com" });
  assert.equal(parsed.success, true);
});

test("delete user schema rejects invalid email", () => {
  const parsed = deleteUserSchema.safeParse({ email: "abc" });
  assert.equal(parsed.success, false);
});

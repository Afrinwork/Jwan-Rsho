import test from "node:test";
import assert from "node:assert/strict";

import { loginSchema } from "@/src/features/auth/validation/loginSchema";

test("Login: empty email is rejected", () => {
  const parsed = loginSchema.safeParse({ email: "", password: "secret123" });
  assert.equal(parsed.success, false);
});

test("Login: invalid email is rejected", () => {
  const parsed = loginSchema.safeParse({ email: "falsch", password: "secret123" });
  assert.equal(parsed.success, false);
});

test("Login: empty password is rejected", () => {
  const parsed = loginSchema.safeParse({ email: "user@example.com", password: "" });
  assert.equal(parsed.success, false);
});

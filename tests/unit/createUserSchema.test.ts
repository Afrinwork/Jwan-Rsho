import test from "node:test";
import assert from "node:assert/strict";

import { createUserSchema } from "@/src/features/admin/validation/createUserSchema";

test("create user schema accepts valid admin input", () => {
  const parsed = createUserSchema.safeParse({
    fullName: "Admin User",
    email: "user@example.com",
    password: "12345678",
    confirmPassword: "12345678",
  });

  assert.equal(parsed.success, true);
});

test("create user schema requires matching passwords", () => {
  const parsed = createUserSchema.safeParse({
    fullName: "Admin User",
    email: "user@example.com",
    password: "12345678",
    confirmPassword: "abcdefgh",
  });

  assert.equal(parsed.success, false);
  assert.equal(parsed.error?.issues[0]?.message, "يجب أن تتطابق كلمتا المرور");
});

test("create user schema requires minimum password length", () => {
  const parsed = createUserSchema.safeParse({
    fullName: "Admin User",
    email: "user@example.com",
    password: "1234567",
    confirmPassword: "1234567",
  });

  assert.equal(parsed.success, false);
  assert.equal(parsed.error?.issues[0]?.message, "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل");
});

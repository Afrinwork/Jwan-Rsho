import test from "node:test";
import assert from "node:assert/strict";

import { buildPhoneUrl } from "@/src/services/phoneService.shared";

test("valid phone numbers are normalized into tel urls", () => {
  assert.equal(buildPhoneUrl("+49 123 456"), "tel:+49123456");
});

test("invalid phone numbers raise a friendly error", () => {
  assert.throws(() => buildPhoneUrl(""), /Keine gueltige Telefonnummer vorhanden/);
});

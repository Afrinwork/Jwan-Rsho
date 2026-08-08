import test from "node:test";
import assert from "node:assert/strict";

import { normalizeCity } from "@/src/utils/normalizeCity";

test("normalizeCity trims and lowercases values", () => {
  assert.equal(normalizeCity(" Hamburg "), "hamburg");
});

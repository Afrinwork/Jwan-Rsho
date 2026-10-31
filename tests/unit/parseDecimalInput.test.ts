import test from "node:test";
import assert from "node:assert/strict";

import { parseDecimalInput } from "@/src/utils/parseDecimalInput";

test("parseDecimalInput reads German and English decimals, also while typing", () => {
  assert.equal(parseDecimalInput("1,5"), 1.5);
  assert.equal(parseDecimalInput("1.5"), 1.5);
  assert.equal(parseDecimalInput("1,"), 1);
  assert.equal(parseDecimalInput(",5"), 0.5);
  assert.equal(parseDecimalInput("12"), 12);
});

test("parseDecimalInput: empty is 0, anything else that isn't a number is ignored", () => {
  assert.equal(parseDecimalInput(""), 0);
  assert.equal(parseDecimalInput(","), null);
  assert.equal(parseDecimalInput("1,5,"), null);
  assert.equal(parseDecimalInput("-1"), null);
  assert.equal(parseDecimalInput("abc"), null);
});

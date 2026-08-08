import test from "node:test";
import assert from "node:assert/strict";

import { regionSchema } from "@/src/features/regions/validation/regionSchema";

test("region schema accepts valid input", () => {
  const parsed = regionSchema.safeParse({
    name: "Nord",
    country: "Deutschland",
    city: "Hamburg",
    isActive: true,
  });

  assert.equal(parsed.success, true);
});

test("region schema requires a country", () => {
  const parsed = regionSchema.safeParse({
    name: "Nord",
    country: "",
    city: "Hamburg",
    isActive: true,
  });

  assert.equal(parsed.success, false);
});

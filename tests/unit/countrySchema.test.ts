import test from "node:test";
import assert from "node:assert/strict";

import { countrySchema } from "@/src/features/countries/validation/countrySchema";

test("country schema accepts valid input", () => {
  const parsed = countrySchema.safeParse({
    name: "Deutschland",
    isoCode: "DE",
    sortOrder: 1,
    isActive: true,
  });

  assert.equal(parsed.success, true);
});

test("country schema rejects missing name", () => {
  const parsed = countrySchema.safeParse({
    name: "",
    isoCode: "DE",
    sortOrder: 1,
    isActive: true,
  });

  assert.equal(parsed.success, false);
});

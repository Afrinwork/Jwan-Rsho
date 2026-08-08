import test from "node:test";
import assert from "node:assert/strict";

import { productSchema } from "@/src/features/products/validation/productSchema";

test("product schema accepts valid sort order", () => {
  const parsed = productSchema.safeParse({
    name: "Wasser",
    defaultUnit: "Kiste",
    sortOrder: 2,
    isActive: true,
  });

  assert.equal(parsed.success, true);
});

test("product schema requires a name", () => {
  const parsed = productSchema.safeParse({
    name: "",
    defaultUnit: "Kiste",
    sortOrder: 0,
    isActive: true,
  });

  assert.equal(parsed.success, false);
});

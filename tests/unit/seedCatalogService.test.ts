import test from "node:test";
import assert from "node:assert/strict";

import { findMissingByName } from "@/src/features/management/services/seedCatalogService";

test("items already present by name (case-insensitive) are skipped", () => {
  const missing = findMissingByName(
    [{ name: "Labneh" }, { name: "Oliven" }, { name: "Qishta" }],
    ["labneh", "Deutschland"],
  );

  assert.deepEqual(missing, [{ name: "Oliven" }, { name: "Qishta" }]);
});

test("empty existing list keeps every seed item", () => {
  const missing = findMissingByName([{ name: "Makdos" }], []);
  assert.deepEqual(missing, [{ name: "Makdos" }]);
});

test("all items already present returns an empty list", () => {
  const missing = findMissingByName([{ name: "Makdos" }], ["Makdos"]);
  assert.deepEqual(missing, []);
});

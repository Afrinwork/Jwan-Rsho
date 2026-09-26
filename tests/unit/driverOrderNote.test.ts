import test from "node:test";
import assert from "node:assert/strict";

import { buildDriverOrderNote, driverNameFromOrderNote } from "@/src/features/orders/services/driverOrderNote";

test("driver order notes round-trip the driver's name", () => {
  assert.equal(driverNameFromOrderNote(buildDriverOrderNote("Ccc")), "Ccc");
  assert.equal(driverNameFromOrderNote(buildDriverOrderNote("  ")), "");
});

test("other notes are not treated as driver-created", () => {
  assert.equal(driverNameFromOrderNote("Bitte klingeln"), null);
  assert.equal(driverNameFromOrderNote(null), null);
});

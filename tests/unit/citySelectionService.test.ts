import test from "node:test";
import assert from "node:assert/strict";

import { resetCustomerSelection, selectAllOpenCustomerIds, toggleCustomerSelection } from "@/src/features/cities/services/citySelectionService";

test("single customer selection toggles on and off", () => {
  const selected = toggleCustomerSelection([], "c1");
  assert.deepEqual(selected, ["c1"]);
  assert.deepEqual(toggleCustomerSelection(selected, "c1"), []);
});

test("select all open only returns open customer ids", () => {
  const selected = selectAllOpenCustomerIds([
    { id: "c1", fullName: "A", phone: "1", street: "S", houseNumber: "1", postalCode: "1", city: "H", currentOpenOrderId: "o1", currentOpenOrderLabel: "Offen", status: "open" },
    { id: "c2", fullName: "B", phone: "2", street: "S", houseNumber: "2", postalCode: "2", city: "H", currentOpenOrderId: null, currentOpenOrderLabel: null, status: "completed" },
  ]);

  assert.deepEqual(selected, ["c1"]);
  assert.deepEqual(resetCustomerSelection(), []);
});

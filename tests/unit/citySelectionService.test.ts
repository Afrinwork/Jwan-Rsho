import test from "node:test";
import assert from "node:assert/strict";

import { resetCustomerSelection, selectAllCustomerIds, toggleCustomerSelection } from "@/src/features/cities/services/citySelectionService";

test("single customer selection toggles on and off", () => {
  const selected = toggleCustomerSelection([], "c1");
  assert.deepEqual(selected, ["c1"]);
  assert.deepEqual(toggleCustomerSelection(selected, "c1"), []);
});

test("select all returns all visible customer ids", () => {
  const selected = selectAllCustomerIds([
    { id: "c1", fullName: "A", phone: "1", address: "S 1", city: "H", currentOpenOrderId: "o1", currentOpenOrderLabel: "Offen", status: "open" },
    { id: "c2", fullName: "B", phone: "2", address: "S 2", city: "H", currentOpenOrderId: null, currentOpenOrderLabel: null, status: "completed" },
  ]);

  assert.deepEqual(selected, ["c1", "c2"]);
  assert.deepEqual(resetCustomerSelection(), []);
});

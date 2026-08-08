import test from "node:test";
import assert from "node:assert/strict";

import { buildCustomerLocationMessage } from "@/src/services/sharingService.shared";

test("share message contains customer name address and map link", () => {
  const message = buildCustomerLocationMessage({
    fullName: "Nour",
    address: "Main 5, 1000 Berlin, DE",
    latitude: 52.52,
    longitude: 13.405,
  });

  assert.match(message, /Nour/);
  assert.match(message, /Main 5, 1000 Berlin, DE/);
  assert.match(message, /Koordinaten: 52.52, 13.405/);
  assert.match(message, /maps\.apple\.com/);
});

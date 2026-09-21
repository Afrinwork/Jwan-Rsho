import test from "node:test";
import assert from "node:assert/strict";

import { boundsFromCoordinates } from "@/src/features/map/utils/geoBounds";

test("boundsFromCoordinates expands a single point into a usable camera area", () => {
  const [west, south, east, north] = boundsFromCoordinates([{ latitude: 52.52, longitude: 13.405 }]);

  assert.ok(east > west);
  assert.ok(north > south);
  assert.equal((east - west).toFixed(3), "0.002");
  assert.equal((north - south).toFixed(3), "0.002");
});

test("boundsFromCoordinates preserves an already useful multi-point area", () => {
  assert.deepEqual(
    boundsFromCoordinates([
      { latitude: 52.4, longitude: 13.2 },
      { latitude: 52.7, longitude: 13.6 },
    ]),
    [13.2, 52.4, 13.6, 52.7],
  );
});

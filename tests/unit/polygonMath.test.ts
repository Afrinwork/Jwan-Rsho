import test from "node:test";
import assert from "node:assert/strict";

import { isPointInsidePolygon } from "@/src/features/map/utils/polygonMath";

const square = [
  { latitude: 0, longitude: 0 },
  { latitude: 0, longitude: 10 },
  { latitude: 10, longitude: 10 },
  { latitude: 10, longitude: 0 },
];

test("point inside the polygon is detected", () => {
  assert.equal(isPointInsidePolygon({ latitude: 5, longitude: 5 }, square), true);
});

test("point outside the polygon is not detected", () => {
  assert.equal(isPointInsidePolygon({ latitude: 20, longitude: 20 }, square), false);
});

test("fewer than three points can never contain a point", () => {
  assert.equal(
    isPointInsidePolygon({ latitude: 5, longitude: 5 }, [
      { latitude: 0, longitude: 0 },
      { latitude: 10, longitude: 10 },
    ]),
    false,
  );
});

import test from "node:test";
import assert from "node:assert/strict";

import { isPointInsideCircle } from "@/src/features/map/utils/circleMath";

test("point at the circle center is inside", () => {
  assert.equal(
    isPointInsideCircle({ latitude: 52.52, longitude: 13.4 }, { latitude: 52.52, longitude: 13.4, radiusKm: 1 }),
    true,
  );
});

test("point far outside the radius is not inside", () => {
  assert.equal(
    isPointInsideCircle({ latitude: 48.13, longitude: 11.58 }, { latitude: 52.52, longitude: 13.4, radiusKm: 5 }),
    false,
  );
});

test("point just within the radius is inside", () => {
  assert.equal(
    isPointInsideCircle({ latitude: 52.53, longitude: 13.4 }, { latitude: 52.52, longitude: 13.4, radiusKm: 2 }),
    true,
  );
});

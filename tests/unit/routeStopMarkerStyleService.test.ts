import test from "node:test";
import assert from "node:assert/strict";

import { resolveRouteStopMarkerStyle } from "@/src/features/route/services/routeStopMarkerStyleService";

test("active always wins, even over an imprecise address", () => {
  const style = resolveRouteStopMarkerStyle({ active: true, hasStreetAddress: false });
  assert.equal(style.backgroundColor, "#B42318");
  assert.equal(style.scale, 1.15);
});

test("a skipped stop gets its own color, distinct from a completed one", () => {
  const skipped = resolveRouteStopMarkerStyle({ active: false, inactive: true, skipped: true });
  const completed = resolveRouteStopMarkerStyle({ active: false, inactive: true, skipped: false });
  assert.notEqual(skipped.backgroundColor, completed.backgroundColor);
  assert.equal(completed.backgroundColor, "#6B7280");
  assert.equal(skipped.backgroundColor, "#F97316");
});

test("inactive (completed or skipped) wins over an imprecise address", () => {
  const style = resolveRouteStopMarkerStyle({ active: false, inactive: true, skipped: true, hasStreetAddress: false });
  assert.equal(style.backgroundColor, "#F97316");
});

test("a pending stop with no street address gets the imprecise-location color", () => {
  const style = resolveRouteStopMarkerStyle({ active: false, hasStreetAddress: false });
  assert.equal(style.backgroundColor, "#EAB308");
});

test("a normal pending stop with a street address gets the default color", () => {
  const style = resolveRouteStopMarkerStyle({ active: false, hasStreetAddress: true });
  assert.equal(style.backgroundColor, "#111111");
});

test("hasStreetAddress undefined behaves like a normal address (matches CustomerMarker's convention)", () => {
  const style = resolveRouteStopMarkerStyle({ active: false });
  assert.equal(style.backgroundColor, "#111111");
});

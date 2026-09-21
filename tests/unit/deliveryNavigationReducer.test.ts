import test from "node:test";
import assert from "node:assert/strict";

import { deliveryNavigationReducer } from "@/src/features/delivery-navigation/deliveryNavigationReducer";
import { DeliveryStop, initialDeliveryNavigationState } from "@/src/features/delivery-navigation/deliveryNavigationTypes";
import { RoutingLeg } from "@/src/services/routing/routingTypes";

function makeStop(customerId: string, overrides: Partial<DeliveryStop> = {}): DeliveryStop {
  return { customerId, name: `Customer ${customerId}`, latitude: 52.5, longitude: 13.4, status: "pending", ...overrides };
}

function makeLeg(overrides: Partial<RoutingLeg> = {}): RoutingLeg {
  return { distanceMeters: 5000, durationSeconds: 600, polyline: [], ...overrides };
}

test("START activates the first pending stop and begins navigating", () => {
  const stops = [makeStop("c1"), makeStop("c2"), makeStop("c3")];
  const state = deliveryNavigationReducer(initialDeliveryNavigationState, {
    type: "START",
    stops,
    currentLocation: { latitude: 1, longitude: 1 },
  });

  assert.equal(state.isNavigating, true);
  assert.equal(state.currentStopIndex, 0);
  assert.equal(state.stops[0].status, "active");
  assert.equal(state.stops[1].status, "pending");
  assert.deepEqual(state.currentLocation, { latitude: 1, longitude: 1 });
});

test("START with an empty stop list does not start navigating", () => {
  const state = deliveryNavigationReducer(initialDeliveryNavigationState, { type: "START", stops: [], currentLocation: null });
  assert.equal(state.isNavigating, false);
  assert.equal(state.currentStopIndex, -1);
});

test("STOP_COMPLETED advances to the next pending stop and blanks the stale route immediately", () => {
  const started = deliveryNavigationReducer(initialDeliveryNavigationState, {
    type: "START",
    stops: [makeStop("c1"), makeStop("c2")],
    currentLocation: null,
  });
  const withRoute = deliveryNavigationReducer(started, { type: "ROUTE_LOADED", leg: makeLeg() });
  const advanced = deliveryNavigationReducer(withRoute, { type: "STOP_COMPLETED", stopIndex: 0 });

  assert.equal(advanced.stops[0].status, "completed");
  assert.equal(advanced.stops[1].status, "active");
  assert.equal(advanced.currentStopIndex, 1);
  assert.equal(advanced.isNavigating, true);
  // Distance/ETA from the just-finished leg must not linger for the new stop.
  assert.equal(advanced.activeRoute, null);
  assert.equal(advanced.remainingRouteDistanceMeters, null);
  assert.equal(advanced.estimatedArrival, null);
});

test("STOP_SKIPPED marks the stop skipped (not completed) and advances the same way", () => {
  const started = deliveryNavigationReducer(initialDeliveryNavigationState, {
    type: "START",
    stops: [makeStop("c1"), makeStop("c2")],
    currentLocation: null,
  });
  const advanced = deliveryNavigationReducer(started, { type: "STOP_SKIPPED", stopIndex: 0 });

  assert.equal(advanced.stops[0].status, "skipped");
  assert.equal(advanced.stops[1].status, "active");
});

test("SKIP_TO can jump from the current stop to a later stop and skips everything before it", () => {
  const started = deliveryNavigationReducer(initialDeliveryNavigationState, {
    type: "START",
    stops: [makeStop("c1"), makeStop("c2"), makeStop("c3"), makeStop("c4"), makeStop("c5"), makeStop("c6"), makeStop("c7")],
    currentLocation: null,
  });
  const withRoute = deliveryNavigationReducer(started, { type: "ROUTE_LOADED", leg: makeLeg() });
  const jumped = deliveryNavigationReducer(withRoute, { type: "SKIP_TO", stopIndex: 6 });

  assert.equal(jumped.currentStopIndex, 6);
  assert.equal(jumped.isNavigating, true);
  assert.deepEqual(jumped.stops.map((stop) => stop.status), [
    "skipped",
    "skipped",
    "skipped",
    "skipped",
    "skipped",
    "skipped",
    "active",
  ]);
  assert.equal(jumped.activeRoute, null);
  assert.equal(jumped.remainingRouteDistanceMeters, null);
  assert.equal(jumped.estimatedArrival, null);
});

test("completing the last stop ends navigation", () => {
  const started = deliveryNavigationReducer(initialDeliveryNavigationState, {
    type: "START",
    stops: [makeStop("c1")],
    currentLocation: null,
  });
  const finished = deliveryNavigationReducer(started, { type: "STOP_COMPLETED", stopIndex: 0 });

  assert.equal(finished.isNavigating, false);
  assert.equal(finished.stops[0].status, "completed");
});

test("ROUTE_LOADED sets distance/duration and an ETA computed from now + duration", () => {
  const before = Date.now();
  const state = deliveryNavigationReducer(initialDeliveryNavigationState, {
    type: "ROUTE_LOADED",
    leg: makeLeg({ distanceMeters: 12345, durationSeconds: 900 }),
  });
  const after = Date.now();

  assert.equal(state.remainingRouteDistanceMeters, 12345);
  assert.equal(state.remainingRouteDurationSeconds, 900);
  assert.ok(state.estimatedArrival);
  const eta = state.estimatedArrival!.getTime();
  assert.ok(eta >= before + 900_000 && eta <= after + 900_000);
});

test("ROUTE_FAILED sets an error but keeps the last known route on screen instead of blanking it", () => {
  const withRoute = deliveryNavigationReducer(initialDeliveryNavigationState, { type: "ROUTE_LOADED", leg: makeLeg() });
  const failed = deliveryNavigationReducer(withRoute, { type: "ROUTE_FAILED", message: "offline" });

  assert.equal(failed.error, "offline");
  assert.equal(failed.isRouteLoading, false);
  assert.equal(failed.remainingRouteDistanceMeters, withRoute.remainingRouteDistanceMeters);
  assert.equal(failed.activeRoute, withRoute.activeRoute);
});

test("END stops navigating but keeps the stop list around for a summary", () => {
  const started = deliveryNavigationReducer(initialDeliveryNavigationState, {
    type: "START",
    stops: [makeStop("c1"), makeStop("c2")],
    currentLocation: null,
  });
  const ended = deliveryNavigationReducer(started, { type: "END" });

  assert.equal(ended.isNavigating, false);
  assert.equal(ended.stops.length, 2);
});

test("REORDER_LAST moves a not-yet-active pending stop to the end, keeping the active stop unchanged", () => {
  const started = deliveryNavigationReducer(initialDeliveryNavigationState, {
    type: "START",
    stops: [makeStop("c1"), makeStop("c2"), makeStop("c3")],
    currentLocation: null,
  });
  const reordered = deliveryNavigationReducer(started, { type: "REORDER_LAST", customerId: "c2" });

  assert.deepEqual(reordered.stops.map((stop) => stop.customerId), ["c1", "c3", "c2"]);
  assert.equal(reordered.stops[0].status, "active");
  assert.equal(reordered.stops[2].status, "pending");
  assert.equal(reordered.currentStopIndex, 0);
});

test("REORDER_LAST on the currently active stop hands 'active' to the next pending stop and blanks the stale route", () => {
  const started = deliveryNavigationReducer(initialDeliveryNavigationState, {
    type: "START",
    stops: [makeStop("c1"), makeStop("c2"), makeStop("c3")],
    currentLocation: null,
  });
  const withRoute = deliveryNavigationReducer(started, { type: "ROUTE_LOADED", leg: makeLeg() });
  const reordered = deliveryNavigationReducer(withRoute, { type: "REORDER_LAST", customerId: "c1" });

  assert.deepEqual(reordered.stops.map((stop) => stop.customerId), ["c2", "c3", "c1"]);
  assert.equal(reordered.stops[0].status, "active");
  assert.equal(reordered.stops[2].status, "pending");
  assert.equal(reordered.currentStopIndex, 0);
  assert.equal(reordered.activeRoute, null);
  assert.equal(reordered.remainingRouteDistanceMeters, null);
  assert.equal(reordered.estimatedArrival, null);
});

test("REORDER_LAST is a no-op for an already completed or skipped stop", () => {
  const started = deliveryNavigationReducer(initialDeliveryNavigationState, {
    type: "START",
    stops: [makeStop("c1"), makeStop("c2")],
    currentLocation: null,
  });
  const completed = deliveryNavigationReducer(started, { type: "STOP_COMPLETED", stopIndex: 0 });
  const reordered = deliveryNavigationReducer(completed, { type: "REORDER_LAST", customerId: "c1" });

  assert.deepEqual(reordered, completed);
});

test("REORDER_LAST is a no-op for an unknown customerId", () => {
  const started = deliveryNavigationReducer(initialDeliveryNavigationState, {
    type: "START",
    stops: [makeStop("c1"), makeStop("c2")],
    currentLocation: null,
  });
  const reordered = deliveryNavigationReducer(started, { type: "REORDER_LAST", customerId: "ghost" });

  assert.deepEqual(reordered, started);
});

test("GPS_UPDATE updates currentLocation without touching anything else", () => {
  const state = deliveryNavigationReducer(initialDeliveryNavigationState, {
    type: "GPS_UPDATE",
    coordinate: { latitude: 52.1, longitude: 13.2 },
  });
  assert.deepEqual(state.currentLocation, { latitude: 52.1, longitude: 13.2 });
});

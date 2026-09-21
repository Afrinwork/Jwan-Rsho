import test from "node:test";
import assert from "node:assert/strict";

import {
  RouteDirectionsError,
  STOP_SERVICE_BUFFER_SEC,
  buildCumulativeStops,
  buildFallbackLegs,
  decodePolyline,
  extractOverviewPolyline,
  nearestNeighborOrder,
  parseDirectionsResponse,
  parseLegsInRequestOrder,
} from "@/src/features/route/services/routeDirectionsService";

const origin = { latitude: 52.52, longitude: 13.405, label: "Origin" };

test("nearestNeighborOrder visits the closest remaining point first", () => {
  const far = { id: "far", latitude: 53.55, longitude: 10.0 };
  const near = { id: "near", latitude: 52.53, longitude: 13.41 };
  const mid = { id: "mid", latitude: 52.9, longitude: 12.5 };

  const ordered = nearestNeighborOrder(origin, [far, mid, near]);

  assert.deepEqual(ordered.map((point) => point.id), ["near", "mid", "far"]);
});

test("nearestNeighborOrder returns an empty list for no points", () => {
  assert.deepEqual(nearestNeighborOrder(origin, []), []);
});

test("nearestNeighborOrder with lastStopId keeps that point last even if it's the closest", () => {
  const closest = { id: "closest", latitude: 52.521, longitude: 13.406 };
  const far = { id: "far", latitude: 53.55, longitude: 10.0 };

  const ordered = nearestNeighborOrder(origin, [closest, far], "closest");

  assert.deepEqual(ordered.map((point) => point.id), ["far", "closest"]);
});

test("nearestNeighborOrder ignores an unknown lastStopId (behaves like no pin)", () => {
  const near = { id: "near", latitude: 52.53, longitude: 13.41 };
  const far = { id: "far", latitude: 53.55, longitude: 10.0 };

  const ordered = nearestNeighborOrder(origin, [far, near], "does-not-exist");

  assert.deepEqual(ordered.map((point) => point.id), ["near", "far"]);
});

test("buildFallbackLegs accumulates straight-line distance from the origin", () => {
  const points = [
    { id: "a", latitude: 52.53, longitude: 13.41 },
    { id: "b", latitude: 52.55, longitude: 13.43 },
  ];

  const legs = buildFallbackLegs(origin, points);

  assert.equal(legs.length, 2);
  assert.ok(legs[0].distanceKm > 0);
  assert.ok(legs[1].distanceKm > 0);
  assert.ok(legs[0].durationSec > 0);
});

test("buildCumulativeStops sums distance and advances arrival time per leg, plus a 10-minute service buffer between stops", () => {
  const departureDate = new Date("2026-08-30T08:00:00.000Z");
  const legs = [
    { point: { id: "a", latitude: 0, longitude: 0 }, distanceKm: 10, durationSec: 600 },
    { point: { id: "b", latitude: 0, longitude: 0 }, distanceKm: 5, durationSec: 300 },
  ];

  const stops = buildCumulativeStops(legs, departureDate);

  assert.equal(stops[0].cumulativeDistanceKm, 10);
  assert.equal(stops[1].cumulativeDistanceKm, 15);
  // First stop: no prior stop to have spent service time at — pure driving time.
  assert.equal(stops[0].cumulativeEta.toISOString(), "2026-08-30T08:10:00.000Z");
  // Second stop: +10min service buffer at stop 1, then 5min driving to stop 2.
  assert.equal(stops[1].cumulativeEta.toISOString(), "2026-08-30T08:25:00.000Z");
  assert.equal(stops[0].orderIndex, 0);
  assert.equal(stops[1].orderIndex, 1);
});

test("buildCumulativeStops applies the service buffer once per stop after the first, compounding across a longer route", () => {
  const departureDate = new Date("2026-08-30T08:00:00.000Z");
  const legs = [
    { point: { id: "a", latitude: 0, longitude: 0 }, distanceKm: 1, durationSec: 60 },
    { point: { id: "b", latitude: 0, longitude: 0 }, distanceKm: 1, durationSec: 60 },
    { point: { id: "c", latitude: 0, longitude: 0 }, distanceKm: 1, durationSec: 60 },
  ];

  const stops = buildCumulativeStops(legs, departureDate);

  assert.equal(stops[0].cumulativeEta.getTime() - departureDate.getTime(), 60_000);
  assert.equal(stops[1].cumulativeEta.getTime() - departureDate.getTime(), 60_000 + STOP_SERVICE_BUFFER_SEC * 1000 + 60_000);
  assert.equal(
    stops[2].cumulativeEta.getTime() - departureDate.getTime(),
    60_000 + STOP_SERVICE_BUFFER_SEC * 1000 + 60_000 + STOP_SERVICE_BUFFER_SEC * 1000 + 60_000,
  );
});

test("buildCumulativeStops with a single stop applies no service buffer at all", () => {
  const departureDate = new Date("2026-08-30T08:00:00.000Z");
  const legs = [{ point: { id: "a", latitude: 0, longitude: 0 }, distanceKm: 2, durationSec: 120 }];

  const stops = buildCumulativeStops(legs, departureDate);

  assert.equal(stops[0].cumulativeEta.toISOString(), "2026-08-30T08:02:00.000Z");
});

test("parseDirectionsResponse reorders waypoints using waypoint_order", () => {
  const stops = [
    { id: "a", latitude: 1, longitude: 1 },
    { id: "b", latitude: 2, longitude: 2 },
    { id: "c", latitude: 3, longitude: 3 },
  ];

  const response = {
    status: "OK",
    routes: [
      {
        waypoint_order: [2, 0, 1],
        legs: [
          { distance: { value: 1000 }, duration: { value: 120 } },
          { distance: { value: 2000 }, duration: { value: 240 } },
          { distance: { value: 3000 }, duration: { value: 360 } },
          { distance: { value: 4000 }, duration: { value: 480 } },
        ],
      },
    ],
  };

  const legs = parseDirectionsResponse(response, stops);

  assert.deepEqual(legs.map((leg) => leg.point.id), ["c", "a", "b"]);
  assert.equal(legs[0].distanceKm, 1);
  assert.equal(legs[0].durationSec, 120);
});

test("parseDirectionsResponse with lastStopId puts the pinned stop last, regardless of waypoint_order", () => {
  const stops = [
    { id: "a", latitude: 1, longitude: 1 },
    { id: "b", latitude: 2, longitude: 2 },
    { id: "c", latitude: 3, longitude: 3 },
  ];

  // Only "a" and "b" are optimizable waypoints here — "c" is the fixed
  // destination, so waypoint_order indexes into [a, b], not all 3 stops.
  const response = {
    status: "OK",
    routes: [
      {
        waypoint_order: [1, 0],
        legs: [
          { distance: { value: 2000 }, duration: { value: 200 } }, // -> b
          { distance: { value: 1000 }, duration: { value: 100 } }, // -> a
          { distance: { value: 3000 }, duration: { value: 300 } }, // -> c (destination)
        ],
      },
    ],
  };

  const legs = parseDirectionsResponse(response, stops, "c");

  assert.deepEqual(legs.map((leg) => leg.point.id), ["b", "a", "c"]);
  assert.equal(legs[2].distanceKm, 3);
});

test("parseDirectionsResponse with lastStopId as the only stop skips waypoint reordering entirely", () => {
  const stops = [{ id: "only", latitude: 1, longitude: 1 }];
  const response = {
    status: "OK",
    routes: [{ waypoint_order: [], legs: [{ distance: { value: 5000 }, duration: { value: 600 } }] }],
  };

  const legs = parseDirectionsResponse(response, stops, "only");

  assert.deepEqual(legs.map((leg) => leg.point.id), ["only"]);
});

test("parseDirectionsResponse handles a single stop without waypoint reordering", () => {
  const stops = [{ id: "only", latitude: 1, longitude: 1 }];
  const response = {
    status: "OK",
    routes: [
      {
        waypoint_order: [],
        legs: [{ distance: { value: 5000 }, duration: { value: 600 } }],
      },
    ],
  };

  const legs = parseDirectionsResponse(response, stops);

  assert.equal(legs.length, 1);
  assert.equal(legs[0].point.id, "only");
  assert.equal(legs[0].distanceKm, 5);
});

test("parseDirectionsResponse prefers duration_in_traffic when present", () => {
  const stops = [{ id: "only", latitude: 1, longitude: 1 }];
  const response = {
    status: "OK",
    routes: [
      {
        waypoint_order: [],
        legs: [{ distance: { value: 5000 }, duration: { value: 600 }, duration_in_traffic: { value: 900 } }],
      },
    ],
  };

  const legs = parseDirectionsResponse(response, stops);

  assert.equal(legs[0].durationSec, 900);
});

test("parseDirectionsResponse throws a RouteDirectionsError on a non-OK status", () => {
  const response = { status: "REQUEST_DENIED", error_message: "denied", routes: [] };

  assert.throws(() => parseDirectionsResponse(response, []), RouteDirectionsError);
});

test("parseLegsInRequestOrder keeps the requested stop order (no waypoint_order lookup)", () => {
  const stops = [
    { id: "a", latitude: 1, longitude: 1 },
    { id: "b", latitude: 2, longitude: 2 },
  ];

  const response = {
    status: "OK",
    routes: [
      {
        waypoint_order: [],
        legs: [
          { distance: { value: 1000 }, duration: { value: 120 } },
          { distance: { value: 2000 }, duration: { value: 240 } },
        ],
      },
    ],
  };

  const legs = parseLegsInRequestOrder(response, stops);

  assert.deepEqual(legs.map((leg) => leg.point.id), ["a", "b"]);
  assert.equal(legs[0].distanceKm, 1);
  assert.equal(legs[0].durationSec, 120);
  assert.equal(legs[1].distanceKm, 2);
});

test("parseLegsInRequestOrder throws on a non-OK status", () => {
  const response = { status: "ZERO_RESULTS", routes: [] };
  assert.throws(() => parseLegsInRequestOrder(response, []), RouteDirectionsError);
});

test("decodePolyline matches Google's documented example", () => {
  // https://developers.google.com/maps/documentation/utilities/polylinealgorithm
  const decoded = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");

  assert.equal(decoded.length, 3);
  assert.ok(Math.abs(decoded[0].latitude - 38.5) < 1e-4);
  assert.ok(Math.abs(decoded[0].longitude - -120.2) < 1e-4);
  assert.ok(Math.abs(decoded[1].latitude - 40.7) < 1e-4);
  assert.ok(Math.abs(decoded[1].longitude - -120.95) < 1e-4);
  assert.ok(Math.abs(decoded[2].latitude - 43.252) < 1e-4);
  assert.ok(Math.abs(decoded[2].longitude - -126.453) < 1e-4);
});

test("decodePolyline returns an empty list for an empty string", () => {
  assert.deepEqual(decodePolyline(""), []);
});

test("extractOverviewPolyline reads the encoded points from the first route", () => {
  const response = {
    status: "OK",
    routes: [{ waypoint_order: [], overview_polyline: { points: "_p~iF~ps|U" }, legs: [] }],
  };

  assert.equal(extractOverviewPolyline(response), "_p~iF~ps|U");
});

test("extractOverviewPolyline returns null when there is no route or polyline", () => {
  assert.equal(extractOverviewPolyline({ status: "ZERO_RESULTS", routes: [] }), null);
  assert.equal(
    extractOverviewPolyline({ status: "OK", routes: [{ waypoint_order: [], legs: [] }] }),
    null,
  );
});

import test from "node:test";
import assert from "node:assert/strict";

import { buildRouteWhatsappMessages } from "@/src/features/route/services/routeShareFormatterService";
import { RouteStop } from "@/src/features/route/types/routeTypes";

const stop: RouteStop = {
  marker: {
    id: "customer-1",
    title: "Amina",
    description: "Musterstrasse 1",
    phone: "123",
    note: "",
    latitude: 51.45,
    longitude: 7.01,
    numberLabel: "1",
    openOrderCount: 1,
    country: "Deutschland",
    city: "Essen",
    region: "NRW",
  },
  orderIndex: 0,
  distanceFromPreviousKm: 2,
  cumulativeDistanceKm: 2,
  cumulativeEta: new Date("2026-09-20T10:35:00.000Z"),
  isEstimated: false,
};

test("route WhatsApp message includes the individual calculated arrival time", () => {
  const [message] = buildRouteWhatsappMessages([{ stop, orders: [] }]);

  assert.ok(message.message.includes("12:35"));
  assert.ok(message.message.includes("Name: Amina"));
});

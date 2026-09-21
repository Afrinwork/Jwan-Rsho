import test from "node:test";
import assert from "node:assert/strict";

import { buildEmailExport, canStartSelectionExport, getCustomerIdsInsideShape } from "@/src/features/map/services/mapSelectionExportService";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { OrderWithItems } from "@/src/types/order";

function marker(overrides: Partial<MapCustomerMarker>): MapCustomerMarker {
  return {
    id: "c1",
    title: "Name",
    description: "Street 1, Berlin",
    phone: "111",
    note: "",
    latitude: 0,
    longitude: 0,
    numberLabel: "1",
    openOrderCount: 1,
    country: "DE",
    city: "Berlin",
    region: "",
    ...overrides,
  };
}

function order(overrides: Partial<OrderWithItems>): OrderWithItems {
  return {
    id: "o1",
    ownerId: "owner",
    customerId: "c1",
    status: "open",
    orderedAt: "2026-09-17T00:00:00.000Z",
    createdAt: "2026-09-17T00:00:00.000Z",
    updatedAt: "2026-09-17T00:00:00.000Z",
    items: [
      {
        id: "i1",
        productId: "p1",
        productNameSnapshot: "Kaese",
        quantity: 2,
        unit: "kg",
        sortOrder: 0,
      },
    ],
    ...overrides,
  };
}

test("getCustomerIdsInsideShape returns unique customer ids for more than 30 selected markers", () => {
  const markers = Array.from({ length: 35 }, (_, index) => marker({ id: `c${index}`, latitude: 0, longitude: 0 }));

  assert.equal(getCustomerIdsInsideShape([...markers, markers[0]], { type: "circle", circle: { latitude: 0, longitude: 0, radiusKm: 1 } }).length, 35);
});

test("getCustomerIdsInsideShape returns unique customer ids for more than 100 selected markers", () => {
  const markers = Array.from({ length: 125 }, (_, index) => marker({ id: `c${index}`, latitude: 1, longitude: 1 }));
  const polygon = [
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 2 },
    { latitude: 2, longitude: 2 },
    { latitude: 2, longitude: 0 },
  ];

  assert.equal(getCustomerIdsInsideShape([...markers, markers[5]], { type: "polygon", polygon }).length, 125);
});

test("buildEmailExport keeps customers without open orders visible", () => {
  const exportSnapshot = buildEmailExport({
    customerIds: ["c1", "c2", "c1"],
    markers: [marker({ id: "c1", title: "Amina" }), marker({ id: "c2", title: "Sara", openOrderCount: 0 })],
    orders: [order({ customerId: "c1" })],
    productEmojiById: new Map(),
  });

  assert.equal(exportSnapshot.customerCount, 2);
  assert.equal(exportSnapshot.openOrderCount, 1);
  assert.deepEqual(exportSnapshot.customersWithoutOpenOrders.map((customer) => customer.fullName), ["Sara"]);
  assert.ok(exportSnapshot.message.includes("Name: Sara"));
  assert.ok(exportSnapshot.message.includes("Keine offene Bestellung"));
});

test("buildEmailExport includes multiple open orders for one customer", () => {
  const exportSnapshot = buildEmailExport({
    customerIds: ["c1"],
    markers: [marker({ id: "c1", title: "Amina" })],
    orders: [
      order({ id: "o1", customerId: "c1" }),
      order({
        id: "o2",
        customerId: "c1",
        items: [{ id: "i2", productId: "p2", productNameSnapshot: "Labneh", quantity: 1, unit: "kg", sortOrder: 0 }],
      }),
    ],
    productEmojiById: new Map(),
  });

  assert.equal(exportSnapshot.openOrderCount, 2);
  assert.ok(exportSnapshot.message.includes("Kaese: 2 kg"));
  assert.ok(exportSnapshot.message.includes("Labneh: 1 kg"));
});

test("buildEmailExport uses selected id order even when filters reorder markers before sending", () => {
  const exportSnapshot = buildEmailExport({
    customerIds: ["c2", "c1"],
    markers: [marker({ id: "c1", title: "Amina" }), marker({ id: "c2", title: "Sara" })],
    orders: [order({ id: "o1", customerId: "c1" }), order({ id: "o2", customerId: "c2" })],
    productEmojiById: new Map(),
  });

  assert.deepEqual(exportSnapshot.customers.map((customer) => customer.fullName), ["Sara", "Amina"]);
  assert.ok(exportSnapshot.message.indexOf("Name: Sara") < exportSnapshot.message.indexOf("Name: Amina"));
});

test("canStartSelectionExport blocks a fast second send while sharing or emailing", () => {
  assert.equal(canStartSelectionExport({ sharing: false, emailing: false }), true);
  assert.equal(canStartSelectionExport({ sharing: true, emailing: false }), false);
  assert.equal(canStartSelectionExport({ sharing: false, emailing: true }), false);
});

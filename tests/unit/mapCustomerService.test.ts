import test from "node:test";
import assert from "node:assert/strict";

import { buildMapCustomerMarkers, getCustomersNeedingAddressCheck } from "@/src/features/map/services/mapCustomerService";
import { Customer } from "@/src/types/customer";
import { Order } from "@/src/types/order";

function makeCustomer(overrides: Partial<Customer> & { id: string; fullName: string }): Customer {
  return {
    ownerId: "u1",
    phone: "",
    address: "Main 1",
    city: "Berlin",
    normalizedCity: "berlin",
    country: "DE",
    isActive: true,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function makeOrder(overrides: Partial<Order> & { id: string; customerId: string }): Order {
  return {
    ownerId: "u1",
    status: "open",
    orderedAt: "",
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

test("map markers include only customers with open orders and valid coordinates", () => {
  const markers = buildMapCustomerMarkers([
    {
      id: "c1",
      ownerId: "u1",
      fullName: "Bashar",
      phone: "111",
      address: "Main 1, 1000",
      city: "Berlin",
      normalizedCity: "berlin",
      country: "DE",
      latitude: 52.52,
      longitude: 13.4,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "c2",
      ownerId: "u1",
      fullName: "Amina",
      phone: "222",
      address: "River 2, 2000",
      city: "Berlin",
      normalizedCity: "berlin",
      country: "DE",
      latitude: 52.53,
      longitude: 13.41,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "c3",
      ownerId: "u1",
      fullName: "Nadia",
      phone: "333",
      address: "Lake 3, 3000",
      city: "Berlin",
      normalizedCity: "berlin",
      country: "DE",
      latitude: undefined,
      longitude: 13.42,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
  ], [
    { id: "o1", ownerId: "u1", customerId: "c1", status: "open", orderedAt: "", createdAt: "", updatedAt: "" },
    { id: "o2", ownerId: "u1", customerId: "c2", status: "completed", orderedAt: "", createdAt: "", updatedAt: "" },
    { id: "o3", ownerId: "u1", customerId: "c3", status: "open", orderedAt: "", createdAt: "", updatedAt: "" },
  ]);

  assert.deepEqual(markers, [
    {
      id: "c1",
      title: "Bashar",
      description: "Main 1, 1000, Berlin",
      phone: "111",
      note: "",
      latitude: 52.52,
      longitude: 13.4,
      numberLabel: "1",
      openOrderCount: 1,
      country: "DE",
      city: "Berlin",
      region: "",
      hasStreetAddress: true,
    },
  ]);
});

test("map markers flag customers with no street address (city-only)", () => {
  const markers = buildMapCustomerMarkers(
    [
      {
        id: "c1",
        ownerId: "u1",
        fullName: "Bashar",
        phone: "111",
        address: "",
        city: "Berlin",
        normalizedCity: "berlin",
        country: "DE",
        latitude: 52.52,
        longitude: 13.4,
        isActive: true,
        createdAt: "",
        updatedAt: "",
      },
    ],
    [{ id: "o1", ownerId: "u1", customerId: "c1", status: "open", orderedAt: "", createdAt: "", updatedAt: "" }],
  );

  assert.equal(markers[0]?.hasStreetAddress, false);
});

test("map markers flag a city repeated in the address field as an imprecise location", () => {
  const markers = buildMapCustomerMarkers(
    [makeCustomer({ id: "c1", fullName: "Bashar", address: "  BERLIN ", city: "Berlin", latitude: 52.52, longitude: 13.4 })],
    [makeOrder({ id: "o1", customerId: "c1" })],
  );

  assert.equal(markers[0]?.hasStreetAddress, false);
});

test("map markers with identical coordinates (e.g. same city-only address) are spread apart, not stacked", () => {
  const sharedCoordinate = { latitude: 52.52, longitude: 13.4 };
  const customers = ["a", "b", "c"].map((suffix) => ({
    id: `c-${suffix}`,
    ownerId: "u1",
    fullName: `Customer ${suffix}`,
    phone: "",
    address: "",
    city: "Berlin",
    normalizedCity: "berlin",
    country: "DE",
    ...sharedCoordinate,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  }));
  const openOrders = customers.map((customer, index) => ({
    id: `o-${index}`,
    ownerId: "u1",
    customerId: customer.id,
    status: "open" as const,
    orderedAt: "",
    createdAt: "",
    updatedAt: "",
  }));

  const markers = buildMapCustomerMarkers(customers, openOrders);

  assert.equal(markers.length, 3);
  const coordinateKeys = markers.map((marker) => `${marker.latitude},${marker.longitude}`);
  assert.equal(new Set(coordinateKeys).size, 3, "each marker should end up at a distinct coordinate");
  // Still close to the real, shared point — this is a display nudge, not a
  // relocation to somewhere unrelated.
  markers.forEach((marker) => {
    assert.ok(Math.abs(marker.latitude - sharedCoordinate.latitude) < 0.01);
    assert.ok(Math.abs(marker.longitude - sharedCoordinate.longitude) < 0.01);
  });
});

test("map markers are sorted by customer name and numbered sequentially", () => {
  const markers = buildMapCustomerMarkers([
    {
      id: "c1",
      ownerId: "u1",
      fullName: "Zara",
      phone: "111",
      address: "Main 1, 1000",
      city: "Berlin",
      normalizedCity: "berlin",
      country: "DE",
      latitude: 52.52,
      longitude: 13.4,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "c2",
      ownerId: "u1",
      fullName: "Amina",
      phone: "222",
      address: "River 2, 2000",
      city: "Berlin",
      normalizedCity: "berlin",
      country: "DE",
      latitude: 52.53,
      longitude: 13.41,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
  ], [
    { id: "o1", ownerId: "u1", customerId: "c1", status: "open", orderedAt: "", createdAt: "", updatedAt: "" },
    { id: "o2", ownerId: "u1", customerId: "c2", status: "open", orderedAt: "", createdAt: "", updatedAt: "" },
  ]);

  assert.equal(markers[0]?.title, "Amina");
  assert.equal(markers[0]?.numberLabel, "1");
  assert.equal(markers[1]?.title, "Zara");
  assert.equal(markers[1]?.numberLabel, "2");
});

test("getCustomersNeedingAddressCheck: a customer with an open order but no coordinates is listed", () => {
  const customers = [makeCustomer({ id: "c1", fullName: "Nadia" })];
  const orders = [makeOrder({ id: "o1", customerId: "c1" })];

  const needsCheck = getCustomersNeedingAddressCheck(customers, orders);

  assert.equal(needsCheck.length, 1);
  assert.equal(needsCheck[0]?.id, "c1");
  assert.equal(needsCheck[0]?.openOrderCount, 1);
});

test("getCustomersNeedingAddressCheck: a customer with valid coordinates never appears, even with an open order", () => {
  const customers = [makeCustomer({ id: "c1", fullName: "Nadia", latitude: 52.52, longitude: 13.4 })];
  const orders = [makeOrder({ id: "o1", customerId: "c1" })];

  assert.equal(getCustomersNeedingAddressCheck(customers, orders).length, 0);
});

test("getCustomersNeedingAddressCheck: a customer without coordinates but without any open order is not listed (nothing to lose)", () => {
  const customers = [makeCustomer({ id: "c1", fullName: "Nadia" })];
  const orders = [makeOrder({ id: "o1", customerId: "c1", status: "completed" })];

  assert.equal(getCustomersNeedingAddressCheck(customers, orders).length, 0);
});

test("getCustomersNeedingAddressCheck: aggregates open order count across multiple open orders for the same customer", () => {
  const customers = [makeCustomer({ id: "c1", fullName: "Nadia" })];
  const orders = [
    makeOrder({ id: "o1", customerId: "c1" }),
    makeOrder({ id: "o2", customerId: "c1" }),
  ];

  assert.equal(getCustomersNeedingAddressCheck(customers, orders)[0]?.openOrderCount, 2);
});

test("invariant: every customer with an open order ends up in exactly one of markers or needsAddressCheck, never neither and never both", () => {
  const customers = [
    makeCustomer({ id: "c1", fullName: "Has Coords", latitude: 52.52, longitude: 13.4 }),
    makeCustomer({ id: "c2", fullName: "No Coords" }),
    makeCustomer({ id: "c3", fullName: "Invalid Coords", latitude: Number.NaN, longitude: 13.4 }),
    makeCustomer({ id: "c4", fullName: "No Open Order", latitude: undefined, longitude: undefined }),
  ];
  const orders = [
    makeOrder({ id: "o1", customerId: "c1" }),
    makeOrder({ id: "o2", customerId: "c2" }),
    makeOrder({ id: "o3", customerId: "c3" }),
    makeOrder({ id: "o4", customerId: "c4", status: "completed" }),
  ];

  const markers = buildMapCustomerMarkers(customers, orders);
  const needsCheck = getCustomersNeedingAddressCheck(customers, orders);
  const openOrderCustomerIds = new Set(orders.filter((value) => value.status === "open").map((value) => value.customerId));

  for (const customerId of openOrderCustomerIds) {
    const onMap = markers.some((value) => value.id === customerId);
    const flagged = needsCheck.some((value) => value.id === customerId);
    assert.notEqual(onMap, flagged, `customer ${customerId} must be in exactly one list (onMap=${onMap}, flagged=${flagged})`);
  }

  // c4 has no open order at all — correctly absent from both.
  assert.equal(markers.some((value) => value.id === "c4"), false);
  assert.equal(needsCheck.some((value) => value.id === "c4"), false);
});

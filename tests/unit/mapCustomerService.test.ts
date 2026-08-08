import test from "node:test";
import assert from "node:assert/strict";

import { buildMapCustomerMarkers } from "@/src/features/map/services/mapCustomerService";

test("map markers include only customers with open orders and valid coordinates", () => {
  const markers = buildMapCustomerMarkers([
    {
      id: "c1",
      ownerId: "u1",
      fullName: "Bashar",
      phone: "111",
      street: "Main",
      houseNumber: "1",
      postalCode: "1000",
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
      street: "River",
      houseNumber: "2",
      postalCode: "2000",
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
      street: "Lake",
      houseNumber: "3",
      postalCode: "3000",
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
      description: "Main 1, 1000 Berlin",
      phone: "111",
      latitude: 52.52,
      longitude: 13.4,
      numberLabel: "1",
      currentOpenOrderId: "o1",
      country: "DE",
      city: "Berlin",
      region: "",
    },
  ]);
});

test("map markers are sorted by customer name and numbered sequentially", () => {
  const markers = buildMapCustomerMarkers([
    {
      id: "c1",
      ownerId: "u1",
      fullName: "Zara",
      phone: "111",
      street: "Main",
      houseNumber: "1",
      postalCode: "1000",
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
      street: "River",
      houseNumber: "2",
      postalCode: "2000",
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

import test from "node:test";
import assert from "node:assert/strict";

import { buildCustomerEditFormValues } from "@/src/features/customers/services/customerEditService";

test("customer edit form values include customer fields and open order items", () => {
  const values = buildCustomerEditFormValues(
    {
      id: "c1",
      ownerId: "u1",
      fullName: "Rana",
      phone: "12345",
      address: "Main 7, 1000",
      city: "Berlin",
      normalizedCity: "berlin",
      country: "DE",
      region: "BE",
      latitude: 52.5,
      longitude: 13.4,
      note: "Bitte klingeln",
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "o1",
      ownerId: "u1",
      customerId: "c1",
      status: "open",
      orderedAt: "",
      createdAt: "",
      updatedAt: "",
      items: [
        {
          id: "i1",
          productId: "p1",
          productNameSnapshot: "Wasser",
          quantity: 2,
          unit: "Kisten",
          sortOrder: 0,
        },
      ],
    },
  );

  assert.deepEqual(values, {
    customerId: "c1",
    customer: {
      fullName: "Rana",
      phone: "12345",
      note: "Bitte klingeln",
      address: "Main 7, 1000",
      city: "Berlin",
      country: "DE",
      region: "BE",
      latitude: 52.5,
      longitude: 13.4,
      isActive: true,
    },
    items: [
      {
        productId: "p1",
        productNameSnapshot: "Wasser",
        quantity: 2,
        unit: "Kisten",
        sortOrder: 0,
      },
    ],
  });
});

import test from "node:test";
import assert from "node:assert/strict";

import { buildCitySummaries, filterCitySummaries, getCountryOptions } from "@/src/features/cities/services/cityService";

test("city summaries are grouped from customers and open orders", () => {
  const summaries = buildCitySummaries([
    { id: "c1", ownerId: "u1", fullName: "A", phone: "1", street: "S", houseNumber: "1", postalCode: "1", city: "Hamburg", normalizedCity: "hamburg", country: "DE", isActive: true, createdAt: "", updatedAt: "" },
    { id: "c2", ownerId: "u1", fullName: "B", phone: "2", street: "S", houseNumber: "2", postalCode: "2", city: "Hamburg", normalizedCity: "hamburg", country: "DE", isActive: true, createdAt: "", updatedAt: "" },
  ], [
    { id: "o1", ownerId: "u1", customerId: "c1", status: "open", orderedAt: "", createdAt: "", updatedAt: "" },
    { id: "o2", ownerId: "u1", customerId: "c2", status: "completed", orderedAt: "", createdAt: "", updatedAt: "" },
  ]);

  assert.deepEqual(summaries, [
    { name: "Hamburg", normalizedName: "hamburg", country: "DE", customerCount: 2, openOrderCount: 1 },
  ]);
});

test("city summaries support search and country filter", () => {
  const summaries = [
    { name: "Hamburg", normalizedName: "hamburg", country: "DE", customerCount: 2, openOrderCount: 1 },
    { name: "Paris", normalizedName: "paris", country: "FR", customerCount: 1, openOrderCount: 0 },
  ];

  assert.equal(filterCitySummaries(summaries, "ham", "").length, 1);
  assert.equal(filterCitySummaries(summaries, "", "FR").length, 1);
  assert.deepEqual(getCountryOptions(summaries), ["DE", "FR"]);
});

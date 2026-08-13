import test from "node:test";
import assert from "node:assert/strict";

import { buildCitySummaries, filterCitySummaries, getCountryOptions } from "@/src/features/cities/services/cityService";

test("city summaries are grouped from customers and open orders", () => {
  const summaries = buildCitySummaries([
    { id: "city1", ownerId: "u1", name: "Hamburg", normalizedName: "hamburg", isActive: true, sortOrder: 0, createdAt: "", updatedAt: "" },
  ], [
    { id: "c1", ownerId: "u1", fullName: "A", phone: "1", address: "S 1", city: "Hamburg", normalizedCity: "hamburg", country: "DE", isActive: true, createdAt: "", updatedAt: "" },
    { id: "c2", ownerId: "u1", fullName: "B", phone: "2", address: "S 2", city: "Hamburg", normalizedCity: "hamburg", country: "DE", isActive: true, createdAt: "", updatedAt: "" },
  ], [
    { id: "o1", ownerId: "u1", customerId: "c1", status: "open", orderedAt: "", createdAt: "", updatedAt: "" },
    { id: "o2", ownerId: "u1", customerId: "c2", status: "completed", orderedAt: "", createdAt: "", updatedAt: "" },
  ]);

  assert.deepEqual(summaries, [
    { id: "city1", name: "Hamburg", nameAr: undefined, normalizedName: "hamburg", country: "DE", customerCount: 2, openOrderCount: 1 },
  ]);
});

test("a city with no customers still shows up, with zero counts", () => {
  const summaries = buildCitySummaries([
    { id: "city1", ownerId: "u1", name: "Bremen", normalizedName: "bremen", isActive: true, sortOrder: 0, createdAt: "", updatedAt: "" },
  ], [], []);

  assert.deepEqual(summaries, [
    { id: "city1", name: "Bremen", nameAr: undefined, normalizedName: "bremen", country: "", customerCount: 0, openOrderCount: 0 },
  ]);
});

test("city summaries support search and country filter", () => {
  const summaries = [
    { id: "1", name: "Hamburg", normalizedName: "hamburg", country: "DE", customerCount: 2, openOrderCount: 1 },
    { id: "2", name: "Paris", normalizedName: "paris", country: "FR", customerCount: 1, openOrderCount: 0 },
  ];

  assert.equal(filterCitySummaries(summaries, "ham", "").length, 1);
  assert.equal(filterCitySummaries(summaries, "", "FR").length, 1);
  assert.deepEqual(getCountryOptions(summaries), ["DE", "FR"]);
});

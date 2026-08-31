import test from "node:test";
import assert from "node:assert/strict";

import { RouteGeocodingError, extractEuropeanLocation } from "@/src/features/route/services/routeGeocodingService";

function buildResponse(countryShortName: string) {
  return {
    status: "OK",
    results: [
      {
        formatted_address: "Musterstrasse 1, Hamburg, Germany",
        geometry: { location: { lat: 53.55, lng: 10.0 } },
        address_components: [{ short_name: countryShortName, types: ["country", "political"] }],
      },
    ],
  };
}

test("extractEuropeanLocation returns the location for a European result", () => {
  const result = extractEuropeanLocation(buildResponse("DE"));

  assert.equal(result.latitude, 53.55);
  assert.equal(result.longitude, 10.0);
  assert.equal(result.formattedAddress, "Musterstrasse 1, Hamburg, Germany");
});

test("extractEuropeanLocation rejects a result outside Europe", () => {
  assert.throws(() => extractEuropeanLocation(buildResponse("US")), (error: unknown) => {
    assert.ok(error instanceof RouteGeocodingError);
    assert.equal(error.code, "OUTSIDE_EUROPE");
    return true;
  });
});

test("extractEuropeanLocation throws NOT_FOUND for zero results", () => {
  assert.throws(() => extractEuropeanLocation({ status: "ZERO_RESULTS", results: [] }), (error: unknown) => {
    assert.ok(error instanceof RouteGeocodingError);
    assert.equal(error.code, "NOT_FOUND");
    return true;
  });
});

test("extractEuropeanLocation throws REQUEST_FAILED for other non-OK statuses", () => {
  assert.throws(() => extractEuropeanLocation({ status: "REQUEST_DENIED", results: [] }), (error: unknown) => {
    assert.ok(error instanceof RouteGeocodingError);
    assert.equal(error.code, "REQUEST_FAILED");
    return true;
  });
});

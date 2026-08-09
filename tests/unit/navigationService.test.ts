import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAppleMapsUrl,
  buildGoogleMapsUrl,
  buildWazeUrl,
} from "@/src/services/navigationService.shared";

test("apple maps url is built for iPhone navigation", () => {
  assert.equal(buildAppleMapsUrl({ latitude: 52.52, longitude: 13.405 }), "http://maps.apple.com/?daddr=52.52,13.405");
});

test("google maps and waze urls are built without route logic in ui", () => {
  assert.equal(buildGoogleMapsUrl({ latitude: 1, longitude: 2 }), "comgooglemaps://?daddr=1,2&directionsmode=driving");
  assert.equal(buildWazeUrl({ latitude: 1, longitude: 2 }), "waze://?ll=1,2&navigate=yes");
});

test("address-based navigation urls use the full customer address", () => {
  assert.equal(
    buildAppleMapsUrl({ address: "Musterstrasse 12, Berlin, Deutschland" }),
    "http://maps.apple.com/?daddr=Musterstrasse%2012%2C%20Berlin%2C%20Deutschland",
  );
  assert.equal(
    buildGoogleMapsUrl({ address: "Musterstrasse 12, Berlin, Deutschland" }),
    "comgooglemaps://?daddr=Musterstrasse%2012%2C%20Berlin%2C%20Deutschland&directionsmode=driving",
  );
  assert.equal(
    buildWazeUrl({ address: "Musterstrasse 12, Berlin, Deutschland" }),
    "waze://?q=Musterstrasse%2012%2C%20Berlin%2C%20Deutschland&navigate=yes",
  );
});

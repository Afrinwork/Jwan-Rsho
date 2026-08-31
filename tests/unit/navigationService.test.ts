import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAppleMapsUrl,
  buildGoogleMapsMultiStopAppUrl,
  buildGoogleMapsMultiStopWebUrl,
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

test("multi-stop google maps app url chains every waypoint with +to:", () => {
  const origin = { latitude: 52.52, longitude: 13.405 };
  const waypoints = [
    { latitude: 1, longitude: 2 },
    { latitude: 3, longitude: 4 },
    { latitude: 5, longitude: 6 },
  ];

  assert.equal(
    buildGoogleMapsMultiStopAppUrl(origin, waypoints),
    "comgooglemaps://?saddr=52.52,13.405&daddr=1,2+to:3,4+to:5,6&directionsmode=driving",
  );
});

test("multi-stop google maps web url starts driving navigation immediately", () => {
  const origin = { latitude: 52.52, longitude: 13.405 };
  const waypoints = [
    { latitude: 1, longitude: 2 },
    { latitude: 3, longitude: 4 },
  ];

  const url = buildGoogleMapsMultiStopWebUrl(origin, waypoints);
  const parsed = new URL(url);

  assert.equal(parsed.origin + parsed.pathname, "https://www.google.com/maps/dir/");
  assert.equal(parsed.searchParams.get("origin"), "52.52,13.405");
  assert.equal(parsed.searchParams.get("destination"), "3,4");
  assert.equal(parsed.searchParams.get("waypoints"), "1,2");
  assert.equal(parsed.searchParams.get("dir_action"), "navigate");
  assert.equal(parsed.searchParams.get("travelmode"), "driving");
});

test("multi-stop urls cap at the Google-supported waypoint limit", () => {
  const origin = { latitude: 0, longitude: 0 };
  const waypoints = Array.from({ length: 15 }, (_, index) => ({ latitude: index, longitude: index }));

  const appUrl = buildGoogleMapsMultiStopAppUrl(origin, waypoints);
  assert.equal(appUrl.match(/\+to:/g)?.length ?? 0, 8);

  const webUrl = buildGoogleMapsMultiStopWebUrl(origin, waypoints);
  const waypointsParam = new URL(webUrl).searchParams.get("waypoints") ?? "";
  assert.equal(waypointsParam.split("|").length, 8);
});

import test from "node:test";
import assert from "node:assert/strict";

import { mapClusteringService } from "@/src/features/map/services/mapClusteringService";
import { MapCustomerMarker, MapRegion } from "@/src/features/map/types/mapTypes";

const region: MapRegion = {
  latitude: 52.52,
  longitude: 13.405,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const markers: MapCustomerMarker[] = [
  {
    id: "customer-1",
    title: "Kunde 1",
    description: "Desc 1",
    phone: "123",
    note: "",
    latitude: 52.52,
    longitude: 13.405,
    numberLabel: "1",
    openOrderCount: 1,
    country: "DE",
    city: "Berlin",
    region: "Mitte",
  },
  {
    id: "customer-2",
    title: "Kunde 2",
    description: "Desc 2",
    phone: "456",
    note: "",
    latitude: 52.53,
    longitude: 13.41,
    numberLabel: "2",
    openOrderCount: 2,
    country: "DE",
    city: "Berlin",
    region: "Mitte",
  },
];

test("buildClusterItems returns marker items as clustering adapter baseline", () => {
  const result = mapClusteringService.buildClusterItems({ markers, region });

  assert.equal(result.length, 2);
  assert.deepEqual(result, [
    {
      type: "marker",
      id: "customer-1",
      coordinate: { latitude: 52.52, longitude: 13.405 },
      marker: markers[0],
    },
    {
      type: "marker",
      id: "customer-2",
      coordinate: { latitude: 52.53, longitude: 13.41 },
      marker: markers[1],
    },
  ]);
});

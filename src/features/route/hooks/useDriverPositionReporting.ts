import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";

import { distanceKm } from "@/src/features/map/utils/circleMath";
import { driverLiveLocationRepository } from "@/src/repositories/driverLiveLocationRepository";
import { DriverLiveLocationSource } from "@/src/types/driverLiveLocation";

type LatLng = { latitude: number; longitude: number };

// At most one write per this interval while the map is open…
const TRIP_MIN_INTERVAL_MS = 30_000;
// …and only after this much movement, or once this long has passed anyway
// (so creeping along in traffic still refreshes the admin's view).
const TRIP_MIN_METERS = 50;
const TRIP_HEARTBEAT_MS = 2 * 60_000;

// Best effort everywhere: the admin's driver view is a convenience, a failed
// write must never disturb the driver.
function report(input: Parameters<typeof driverLiveLocationRepository.report>[0]) {
  void driverLiveLocationRepository.report(input).catch(() => undefined);
}

// The driver is at the customer they just completed.
export function reportCompletedCustomer(customer: LatLng & { name: string }) {
  report({ latitude: customer.latitude, longitude: customer.longitude, source: "app", lastCustomerName: customer.name });
}

// Reports the driver's position each time the app comes to the foreground.
// Never asks for permission itself — the map does that.
export function useReportPositionOnAppOpen(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const reportCurrentPosition = async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) return;
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        report({ latitude: location.coords.latitude, longitude: location.coords.longitude, source: "app" });
      } catch {
        // ignored on purpose
      }
    };

    void reportCurrentPosition();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void reportCurrentPosition();
    });
    return () => subscription.remove();
  }, [enabled]);
}

// Mirrors the live GPS position while the driver's map is open, throttled.
export function useReportTripPosition(coordinate: LatLng | null, enabled: boolean, source: DriverLiveLocationSource) {
  const lastRef = useRef<{ coordinate: LatLng; at: number } | null>(null);

  useEffect(() => {
    if (!enabled || !coordinate) return;
    const now = Date.now();
    const last = lastRef.current;
    if (last) {
      const elapsed = now - last.at;
      if (elapsed < TRIP_MIN_INTERVAL_MS) return;
      if (elapsed < TRIP_HEARTBEAT_MS && distanceKm(last.coordinate, coordinate) * 1000 < TRIP_MIN_METERS) return;
    }
    lastRef.current = { coordinate, at: now };
    report({ latitude: coordinate.latitude, longitude: coordinate.longitude, source });
  }, [coordinate, enabled, source]);
}

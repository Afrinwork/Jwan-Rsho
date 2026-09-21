import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

import { googleDirectionsApiKey } from "@/src/config/googleDirectionsEnv";
import { deliveryNavigationReducer } from "@/src/features/delivery-navigation/deliveryNavigationReducer";
import { DeliveryStop, initialDeliveryNavigationState } from "@/src/features/delivery-navigation/deliveryNavigationTypes";
import { distanceKm } from "@/src/features/map/utils/circleMath";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { routeT } from "@/src/features/route/i18n/routeT";
import { countryRepository } from "@/src/repositories/countryRepository";
import { formatError } from "@/src/utils/formatError";
import { locationTrackingService, TrackedCoordinate } from "@/src/services/location/LocationTrackingService";
import { estimateStraightLineLeg, fetchOsrmSingleLegRoute, fetchSingleLegRoute } from "@/src/services/routing/RoutingService";
import { RoutingError } from "@/src/services/routing/routingTypes";
import { getTimeZoneForCountry } from "@/src/utils/time/timeZone";

// Don't hit the Directions API on every ~15m GPS tick — only reroute once
// meaningfully off the last routed point, and no more often than this.
const REROUTE_COOLDOWN_MS = 12_000;
const REROUTE_MIN_DISTANCE_METERS = 50;
const DEFAULT_TIME_ZONE = "Europe/Berlin";

function buildStops(markers: MapCustomerMarker[]): DeliveryStop[] {
  return markers.map((marker) => ({
    customerId: marker.id,
    name: marker.title,
    latitude: marker.latitude,
    longitude: marker.longitude,
    status: "pending",
    country: marker.country,
  }));
}

export function useDeliveryNavigation(markers: MapCustomerMarker[]) {
  const [state, dispatch] = useReducer(deliveryNavigationReducer, initialDeliveryNavigationState);
  const [activeTimeZone, setActiveTimeZone] = useState(DEFAULT_TIME_ZONE);

  const requestVersionRef = useRef(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastRoutedFromRef = useRef<TrackedCoordinate | null>(null);
  const lastRoutedAtRef = useRef(0);
  const lastRoutedStopIndexRef = useRef(-1);
  // Populated lazily on start() — free-text country name -> isoCode, built
  // once from the owner's managed country list rather than refetched per stop.
  const countryIsoByNameRef = useRef<Map<string, string> | null>(null);

  const stopWatching = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
  }, []);

  const end = useCallback(() => {
    stopWatching();
    dispatch({ type: "END" });
  }, [stopWatching]);

  const start = useCallback(async () => {
    const hasPermission = await locationTrackingService.requestForegroundPermission();

    if (!hasPermission) {
      dispatch({ type: "ROUTE_FAILED", message: routeT("errors.locationPermissionRequired") });
      return;
    }

    if (!countryIsoByNameRef.current) {
      countryIsoByNameRef.current = await countryRepository
        .getCountries()
        .then((countries) => new Map(countries.filter((country) => country.isoCode).map((country) => [country.normalizedName, country.isoCode as string])))
        .catch(() => new Map());
    }

    const initialPosition = await locationTrackingService.getLastKnownOrCurrentPosition();
    lastRoutedFromRef.current = null;
    lastRoutedAtRef.current = 0;
    lastRoutedStopIndexRef.current = -1;

    dispatch({ type: "START", stops: buildStops(markers), currentLocation: initialPosition });

    stopWatching();
    unsubscribeRef.current = await locationTrackingService.watchPosition(
      (update) => dispatch({ type: "GPS_UPDATE", coordinate: update.coordinate }),
      (message) => dispatch({ type: "ROUTE_FAILED", message }),
    );
  }, [markers, stopWatching]);

  // Marks the currently active stop done/skipped once the caller (which owns
  // the actual Firestore order mutation via useRouteLiveNavigation) confirms
  // it succeeded — this hook only tracks live-routing state, never orders.
  const markStopHandled = useCallback(
    (customerId: string, status: "completed" | "skipped") => {
      const index = state.stops.findIndex((stop) => stop.customerId === customerId && stop.status === "active");
      if (index === -1) return;
      dispatch({ type: status === "completed" ? "STOP_COMPLETED" : "STOP_SKIPPED", stopIndex: index });
    },
    [state.stops],
  );

  const skipToStop = useCallback(
    (customerId: string) => {
      const index = state.stops.findIndex((stop) => stop.customerId === customerId && (stop.status === "active" || stop.status === "pending"));
      if (index === -1) return;
      dispatch({ type: "SKIP_TO", stopIndex: index });
    },
    [state.stops],
  );

  // Changes the route's last stop while GPS turn-by-turn navigation is
  // already running — the caller (RouteLiveScreen) also reorders the plain
  // marker list for useRouteLiveNavigation, but this reducer's `state.stops`
  // is its own snapshot (taken once in start()), so it needs this explicit
  // action to stay in sync instead of picking up the reordered markers prop
  // automatically.
  const reorderLast = useCallback((customerId: string) => {
    dispatch({ type: "REORDER_LAST", customerId });
  }, []);

  useEffect(() => () => stopWatching(), [stopWatching]);

  // Also stop the GPS watch when navigation ends on its own (last stop
  // completed/skipped) — not just when the user explicitly taps "beenden" —
  // otherwise the subscription (and battery drain) would keep running until
  // the whole screen unmounts.
  useEffect(() => {
    if (!state.isNavigating) {
      stopWatching();
    }
  }, [state.isNavigating, stopWatching]);

  // Resolves the active stop's country -> timezone. Falls back to Berlin if
  // the country wasn't found on the managed list (covers today's all-Germany
  // customer base without blocking on the lookup).
  useEffect(() => {
    const activeStop = state.stops[state.currentStopIndex];
    if (!activeStop?.country || !countryIsoByNameRef.current) {
      setActiveTimeZone(DEFAULT_TIME_ZONE);
      return;
    }

    const isoCode = countryIsoByNameRef.current.get(activeStop.country.trim().toLowerCase());
    setActiveTimeZone(getTimeZoneForCountry(isoCode));
  }, [state.stops, state.currentStopIndex]);

  // The one place currentLocation -> activeStop actually gets routed —
  // gated by cooldown + minimum movement so a stationary/jittery GPS fix
  // doesn't spam the Directions API, but always fires immediately the first
  // time a stop becomes active (isNewStop below).
  useEffect(() => {
    if (!state.isNavigating || !state.currentLocation) {
      return;
    }

    const activeStop = state.stops[state.currentStopIndex];
    if (!activeStop) {
      return;
    }

    const now = Date.now();
    const isNewStop = lastRoutedStopIndexRef.current !== state.currentStopIndex;
    const movedMeters = lastRoutedFromRef.current
      ? distanceKm(lastRoutedFromRef.current, state.currentLocation) * 1000
      : Infinity;
    const elapsedMs = now - lastRoutedAtRef.current;

    if (!isNewStop && (elapsedMs < REROUTE_COOLDOWN_MS || movedMeters < REROUTE_MIN_DISTANCE_METERS)) {
      return;
    }

    const requestVersion = ++requestVersionRef.current;
    const origin = state.currentLocation;
    lastRoutedFromRef.current = origin;
    lastRoutedAtRef.current = now;
    lastRoutedStopIndexRef.current = state.currentStopIndex;

    dispatch({ type: "ROUTE_LOADING" });

    const destination = { id: activeStop.customerId, latitude: activeStop.latitude, longitude: activeStop.longitude };

    // Same fallback order as the route-planning screen: paid Google (if
    // configured) -> free no-signup OSRM -> straight-line estimate. Missing
    // key, a failed request, network hiccup, quota limit — none of these
    // should leave the driver looking at a blank "--:--"; only something
    // that isn't a routing-request problem at all surfaces a real error.
    void (async () => {
      try {
        const leg = await fetchSingleLegRoute(origin, destination, googleDirectionsApiKey);
        if (requestVersionRef.current === requestVersion) dispatch({ type: "ROUTE_LOADED", leg });
        return;
      } catch (error) {
        if (!(error instanceof RoutingError)) {
          if (requestVersionRef.current === requestVersion) {
            dispatch({ type: "ROUTE_FAILED", message: formatError(error).message });
          }
          return;
        }
      }

      try {
        const leg = await fetchOsrmSingleLegRoute(origin, destination);
        if (requestVersionRef.current === requestVersion) dispatch({ type: "ROUTE_LOADED", leg });
        return;
      } catch {
        // fall through to the straight-line estimate
      }

      if (requestVersionRef.current === requestVersion) {
        dispatch({ type: "ROUTE_LOADED", leg: estimateStraightLineLeg(origin, activeStop) });
      }
    })();
  }, [state.isNavigating, state.currentLocation, state.currentStopIndex, state.stops]);

  // Returning from the background: don't wait for the next incidental GPS
  // tick (which the OS may delay) — actively fetch a fresh fix so the route
  // updates right away, and let the cooldown gate above evaluate it as new.
  useEffect(() => {
    if (!state.isNavigating) {
      return;
    }

    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState !== "active") return;

      lastRoutedAtRef.current = 0;
      void locationTrackingService.getLastKnownOrCurrentPosition().then((position) => {
        if (position) dispatch({ type: "GPS_UPDATE", coordinate: position });
      });
    });

    return () => subscription.remove();
  }, [state.isNavigating]);

  return { state, activeTimeZone, start, end, markStopHandled, skipToStop, reorderLast };
}

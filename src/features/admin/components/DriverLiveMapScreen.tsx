import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppErrorBoundary } from "@/src/components/layout/AppErrorBoundary";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/constants/spacing";
import { AppMapView } from "@/src/features/map/components/AppMapView";
import { DriverPositionPin } from "@/src/features/admin/components/DriverPositionPin";
import { DriverCityVisibility, DriverStopOrderList } from "@/src/features/admin/components/DriverStopOrderList";
import { useDriverAssignedMarkers } from "@/src/features/admin/hooks/useDriverAssignedMarkers";
import { useDriverOpenCustomerIds } from "@/src/features/admin/hooks/useDriverOpenCustomerIds";
import { RouteMoveStopDialog } from "@/src/features/route/components/RouteMoveStopDialog";
import { RoutePolyline } from "@/src/features/route/components/RoutePolyline";
import { RouteStopMarker } from "@/src/features/route/components/RouteStopMarker";
import { useRouteOrder } from "@/src/features/route/hooks/useRouteOrder";
import { orderRepository } from "@/src/repositories/orderRepository";
import { formatError } from "@/src/utils/formatError";
import { applyManualOrder, moveIdToPosition } from "@/src/features/route/services/routeManualOrderService";
import { MapRegion } from "@/src/features/map/types/mapTypes";
import { AppMapViewHandle } from "@/src/features/map/types/mapViewTypes";
import { radius } from "@/src/theme/radius";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { formatTime } from "@/src/utils/date";

const FALLBACK_REGION: MapRegion = { latitude: 52.52, longitude: 13.405, latitudeDelta: 5, longitudeDelta: 5 };
const DEFAULT_DELTA = { latitudeDelta: 0.08, longitudeDelta: 0.08 };
// A trip mirror older than this is treated as stale (app killed mid-trip
// without clearing it), not as "driving right now".
const TRIP_STALE_MS = 12 * 60 * 60 * 1000;

export type DriverLocation = {
  latitude: number;
  longitude: number;
  address: string;
  updatedAt: string;
};

type DriverLiveMapScreenProps = {
  driverId: string;
  driverName: string;
  customerIds: string[];
  location: DriverLocation | null;
  openCount: number;
  completedToday: number;
};

// "Where is this driver, and what's left" map for admin/super_admin --
// deliberately not the same screen a driver uses to plan/draw/start a
// route: no selection tools, no "start trip" button, nothing an admin could
// accidentally trigger on the driver's behalf. Shows the driver's last
// reported position plus their currently open stops (live), in the
// driver's own list order — which the admin can re-sort here. That order
// is saved as the DRIVER's list, so the driver sees it on their route
// screen right away (and the admin sees the driver's own re-sorts live).
// The admin can also hide stops from the driver — one by one or a whole
// city — without deleting them; the driver's map and route update live.
export function DriverLiveMapScreen(props: DriverLiveMapScreenProps) {
  const { t } = useTranslation("admin");
  const colors = useThemeColors();
  const { customerIds, hiddenCustomerIds } = useDriverOpenCustomerIds(props.driverId, props.customerIds);
  const { markers: unorderedMarkers, loading, error } = useDriverAssignedMarkers(customerIds);
  const routeOrder = useRouteOrder(props.driverId || null);
  const orderedMarkers = useMemo(
    () => (routeOrder.savedIds ? applyManualOrder(unorderedMarkers, routeOrder.savedIds) : unorderedMarkers),
    [unorderedMarkers, routeOrder.savedIds],
  );
  // Numbered exactly like the driver sees them — hidden stops aren't on
  // their list at all, so they don't take a number here either.
  const markers = useMemo(() => orderedMarkers.filter((marker) => !hiddenCustomerIds.has(marker.id)), [orderedMarkers, hiddenCustomerIds]);
  const hiddenMarkers = useMemo(() => orderedMarkers.filter((marker) => hiddenCustomerIds.has(marker.id)), [orderedMarkers, hiddenCustomerIds]);
  const cities = useMemo<DriverCityVisibility[]>(() => {
    const byCity = new Map<string, { count: number; visible: number }>();
    for (const marker of orderedMarkers) {
      const entry = byCity.get(marker.city) ?? { count: 0, visible: 0 };
      entry.count += 1;
      if (!hiddenCustomerIds.has(marker.id)) entry.visible += 1;
      byCity.set(marker.city, entry);
    }
    return [...byCity.entries()]
      .map(([city, entry]) => ({ city, count: entry.count, hidden: entry.visible === 0 }))
      .sort((left, right) => left.city.localeCompare(right.city));
  }, [orderedMarkers, hiddenCustomerIds]);
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);

  async function setHidden(ids: string[], hidden: boolean) {
    setVisibilityBusy(true);
    setVisibilityError(null);
    try {
      const changed = await orderRepository.setHiddenFromDriver(props.driverId, ids, hidden);
      if (changed === 0) setVisibilityError(t("driverMap.nothingChanged"));
    } catch (hideError) {
      setVisibilityError(formatError(hideError).message);
    } finally {
      setVisibilityBusy(false);
    }
  }
  const isManualOrder = routeOrder.savedIds !== null && markers.some((marker) => routeOrder.savedIds?.includes(marker.id));
  const [moveStopId, setMoveStopId] = useState<string | null>(null);
  const moveStopIndex = moveStopId ? markers.findIndex((marker) => marker.id === moveStopId) : -1;

  function moveStop(customerId: string, position: number) {
    const currentIds = markers.map((marker) => marker.id);
    const nextIds = moveIdToPosition(currentIds, customerId, position);
    if (nextIds !== currentIds) void routeOrder.save(nextIds);
  }

  // The driver's trip in progress (mirrored by their RouteLiveScreen): the
  // remaining stops in the order they're driving them, and the next one.
  // Shown on the map as numbered pins joined by a line from the driver's
  // position, so the admin sees the route the driver actually chose.
  const [screenOpenedAt] = useState(() => Date.now());
  const trip =
    routeOrder.trip && screenOpenedAt - new Date(routeOrder.trip.updatedAt).getTime() < TRIP_STALE_MS ? routeOrder.trip : null;
  const markerById = useMemo(() => new Map(orderedMarkers.map((marker) => [marker.id, marker])), [orderedMarkers]);
  const tripMarkers = useMemo(
    () => (trip ? trip.customerIds.map((id) => markerById.get(id)).filter((marker) => marker !== undefined) : []),
    [trip, markerById],
  );
  const tripIds = useMemo(() => new Set(tripMarkers.map((marker) => marker.id)), [tripMarkers]);
  const nextTripStop = trip?.currentCustomerId ? markerById.get(trip.currentCustomerId) ?? null : null;
  const tripLine = useMemo(
    () => [
      ...(props.location ? [{ latitude: props.location.latitude, longitude: props.location.longitude }] : []),
      ...tripMarkers.map((marker) => ({ latitude: marker.latitude, longitude: marker.longitude })),
    ],
    [props.location, tripMarkers],
  );
  // Everything but the map starts collapsed, so the map gets the screen.
  const [panelOpen, setPanelOpen] = useState(false);

  const initialRegion: MapRegion = useMemo(() => {
    if (props.location) {
      return { latitude: props.location.latitude, longitude: props.location.longitude, ...DEFAULT_DELTA };
    }
    if (markers.length) {
      return { latitude: markers[0].latitude, longitude: markers[0].longitude, ...DEFAULT_DELTA };
    }
    return FALLBACK_REGION;
  }, [props.location, markers]);

  // Fit the camera to the driver + their stops once they're known, instead
  // of a fixed zoom around just one of them.
  const mapRef = useRef<AppMapViewHandle | null>(null);
  const fittedRef = useRef(false);
  useEffect(() => {
    if (fittedRef.current || !mapRef.current || !orderedMarkers.length) return;
    const coordinates = [
      ...(props.location ? [{ latitude: props.location.latitude, longitude: props.location.longitude }] : []),
      ...orderedMarkers.map((marker) => ({ latitude: marker.latitude, longitude: marker.longitude })),
    ];
    if (coordinates.length < 2) return;
    fittedRef.current = true;
    mapRef.current.fitToCoordinates(coordinates, { animated: true, edgePadding: { top: 140, right: 50, bottom: 140, left: 50 } });
  }, [orderedMarkers, props.location]);

  return (
    <AppErrorBoundary>
      <View style={styles.screen}>
        <AppMapView initialRegion={initialRegion} ref={mapRef} showsCompass style={StyleSheet.absoluteFill}>
          {trip && tripLine.length >= 2 ? <RoutePolyline coordinates={tripLine} /> : null}
          {props.location ? (
            <DriverPositionPin coordinate={{ latitude: props.location.latitude, longitude: props.location.longitude }} title={props.driverName} />
          ) : null}
          {trip
            ? tripMarkers.map((marker, index) => (
                <RouteStopMarker
                  active={marker.id === trip.currentCustomerId}
                  key={marker.id}
                  label={String(index + 1)}
                  marker={marker}
                  onPress={() => undefined}
                />
              ))
            : markers.map((marker, index) => (
                <RouteStopMarker key={marker.id} active={false} label={String(index + 1)} marker={marker} onPress={() => undefined} />
              ))}
          {/* Open stops that aren't part of the trip (or hidden from the
              driver) — muted, no number. */}
          {(trip ? orderedMarkers.filter((marker) => !tripIds.has(marker.id)) : hiddenMarkers).map((marker) => (
            <RouteStopMarker active={false} inactive key={marker.id} label="–" marker={marker} onPress={() => undefined} />
          ))}
        </AppMapView>

        <SafeAreaView edges={["top"]} pointerEvents="box-none" style={styles.overlay}>
          <View style={[styles.statusPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={[styles.statusDot, { backgroundColor: trip ? colors.success : colors.mutedText }]} />
            <View style={styles.statusText}>
              <AppText numberOfLines={1} variant="bodyMedium">
                {props.driverName}
              </AppText>
              <AppText color="muted" numberOfLines={1} variant="caption">
                {trip
                  ? t("driverMap.tripActive", { count: tripMarkers.length, name: nextTripStop?.title ?? "–" })
                  : t("driverMap.tripInactive")}
              </AppText>
            </View>
            {loading ? <ActivityIndicator color={colors.primary} /> : null}
          </View>
        </SafeAreaView>

        <SafeAreaView edges={["bottom"]} style={[styles.panel, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: panelOpen }}
            onPress={() => setPanelOpen((open) => !open)}
            style={styles.panelToggle}
          >
            <AppText numberOfLines={1} style={styles.panelToggleLabel} variant="bodyMedium">
              {t("driverMap.panelToggle", { count: markers.length, hidden: hiddenMarkers.length })}
            </AppText>
            <MaterialCommunityIcons color={colors.text} name={panelOpen ? "chevron-down" : "chevron-up"} size={22} />
          </Pressable>
          {panelOpen ? (
            <View style={styles.panelBody}>
              <AppText color="muted" variant="caption">
                {t("driverMap.progress", { open: props.openCount, completed: props.completedToday })}
              </AppText>
              <AppText color="muted" numberOfLines={2} variant="caption">
                {props.location
                  ? t("driverMap.lastUpdate", { time: formatTime(props.location.updatedAt), address: props.location.address })
                  : t("driverMap.noLocation")}
              </AppText>
              {error ? <ErrorState message={error} /> : null}
              {routeOrder.error ? <ErrorState message={routeOrder.error} /> : null}
              {visibilityError ? <ErrorState message={visibilityError} /> : null}
              {orderedMarkers.length ? (
                <DriverStopOrderList
                  busy={visibilityBusy}
                  cities={cities}
                  hiddenMarkers={hiddenMarkers}
                  isManualOrder={isManualOrder}
                  markers={markers}
                  onMove={moveStop}
                  onPressPosition={setMoveStopId}
                  onReset={() => void routeOrder.clear()}
                  onToggleCity={(city, hidden) =>
                    void setHidden(orderedMarkers.filter((marker) => marker.city === city).map((marker) => marker.id), hidden)
                  }
                  onToggleHidden={(customerId, hidden) => void setHidden([customerId], hidden)}
                />
              ) : null}
            </View>
          ) : null}
        </SafeAreaView>

        <RouteMoveStopDialog
          key={moveStopId ?? "closed"}
          onCancel={() => setMoveStopId(null)}
          onConfirm={(position) => {
            if (moveStopId) moveStop(moveStopId, position);
            setMoveStopId(null);
          }}
          stop={moveStopIndex === -1 ? null : { name: markers[moveStopIndex].title, position: moveStopIndex + 1 }}
          totalCount={markers.length}
        />
      </View>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  overlay: { position: "absolute", left: 0, right: 0, top: 0, paddingHorizontal: spacing.sm, paddingTop: spacing.xs },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.card,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { flex: 1 },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "60%",
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  panelToggle: { flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: 52 },
  panelToggleLabel: { flex: 1 },
  panelBody: { flexShrink: 1, gap: spacing.xs, paddingBottom: spacing.sm },
});

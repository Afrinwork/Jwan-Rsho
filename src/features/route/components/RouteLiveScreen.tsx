import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppErrorBoundary } from "@/src/components/layout/AppErrorBoundary";
import { AppText } from "@/src/components/ui/AppText";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { DeliveryNavigationControls } from "@/src/features/delivery-navigation/DeliveryNavigationControls";
import { useDeliveryNavigation } from "@/src/features/delivery-navigation/useDeliveryNavigation";
import { routeT } from "@/src/features/route/i18n/routeT";
import { RouteStopMarker } from "@/src/features/route/components/RouteStopMarker";
import { useLiveLocation } from "@/src/features/route/hooks/useLiveLocation";
import { useOrderedMarkers } from "@/src/features/route/hooks/useOrderedMarkers";
import { useRouteLiveNavigation } from "@/src/features/route/hooks/useRouteLiveNavigation";
import { useRoutePolyline } from "@/src/features/route/hooks/useRoutePolyline";
import { formatDistanceKm, formatDurationHM, formatEtaTime } from "@/src/features/route/utils/routeFormat";
import { distanceKm } from "@/src/features/map/utils/circleMath";
import { navigationService } from "@/src/services/navigationService";
import { formatArrivalTime } from "@/src/utils/time/formatArrivalTime";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

const routeStroke = "#2563EB";

type RouteLiveScreenProps = {
  orderedIds: string[];
  // The start location chosen on the list screen — the route/polyline starts
  // from here immediately, without waiting for a live GPS fix. Live position
  // is still used for the "you are here" dot and arrival detection.
  initialOrigin: { latitude: number; longitude: number } | null;
  // The departure time chosen on the list screen — arrival estimates here
  // must stay consistent with what was already shown there instead of
  // silently switching to "now". Falls back to the real current time when
  // absent (e.g. deep-linked straight into this screen).
  initialDepartureTime: Date | null;
};

export function RouteLiveScreen(props: RouteLiveScreenProps) {
  const t = routeT;
  const router = useRouter();
  const colors = useThemeColors();
  const mapRef = useRef<MapView | null>(null);
  const { markers, isLoading, error } = useOrderedMarkers(props.orderedIds);
  const live = useLiveLocation();
  const polylineOrigin = props.initialOrigin ?? live.coordinate;
  const navigation = useRouteLiveNavigation(markers, live.coordinate);
  // Once a stop is marked done/skipped, the line for the remaining stops is
  // recalculated starting from that stop instead of the original start point.
  const remainingRouteOrigin = navigation.legOrigin ?? polylineOrigin;
  const polyline = useRoutePolyline(remainingRouteOrigin, navigation.pendingMarkers, props.initialDepartureTime ?? undefined);
  // Always the distance from the chosen/leg origin (useRoutePolyline now
  // covers the no-API-key and request-failed cases with a straight-line
  // fallback measured from that same origin) — never navigation.distanceToCurrentKm,
  // which is measured from live GPS and is only meant for arrival detection.
  // Falling back to it here used to show a wildly wrong number whenever the
  // device's GPS fix didn't match the chosen start (simulator, no fix yet).
  const displayDistanceKm = polyline.currentLegDistanceKm;

  // Explicit "Route starten" live-navigation layer (Abschnitt 1-24 der Spec):
  // continuously tracks GPS and reroutes currentLocation -> active stop only
  // while active. Stop sequencing itself still lives in useRouteLiveNavigation
  // above — this hook mirrors that same sequence locally so it can drive
  // live distance/ETA/camera without touching the Firestore order logic.
  const delivery = useDeliveryNavigation(markers);
  const isLiveNavigating = delivery.state.isNavigating;
  const liveDistanceKm =
    delivery.state.remainingRouteDistanceMeters !== null ? delivery.state.remainingRouteDistanceMeters / 1000 : null;
  const liveDurationMinutes =
    delivery.state.remainingRouteDurationSeconds !== null ? Math.ceil(delivery.state.remainingRouteDurationSeconds / 60) : null;
  const effectiveDistanceKm = isLiveNavigating ? liveDistanceKm : displayDistanceKm;
  const effectiveDurationMinutes = isLiveNavigating ? liveDurationMinutes : polyline.currentLegDurationMinutes;
  const effectiveEtaLabel = isLiveNavigating
    ? delivery.state.estimatedArrival
      ? formatArrivalTime(delivery.state.estimatedArrival, delivery.activeTimeZone)
      : "--:--"
    : polyline.currentLegEta
      ? formatEtaTime(polyline.currentLegEta)
      : "--:--";

  async function handleMarkComplete() {
    const customerId = navigation.currentMarker?.id;
    const succeeded = await navigation.confirmArrival();
    if (succeeded && customerId) delivery.markStopHandled(customerId, "completed");
  }

  function handleSkip() {
    const customerId = navigation.currentMarker?.id;
    navigation.skipStop();
    if (customerId) delivery.markStopHandled(customerId, "skipped");
  }

  // The camera fits the planned route (chosen origin + stops) once and then
  // stays there — it must never auto-pan to the device's live GPS position,
  // which can be far off (simulator, stale/no fix, ...) and drag the view
  // away from the route the driver is actually looking at.
  useEffect(() => {
    if (!mapRef.current) return;
    const coordinates = [
      ...(polylineOrigin ? [polylineOrigin] : []),
      ...markers.map((marker) => ({ latitude: marker.latitude, longitude: marker.longitude })),
    ];
    if (coordinates.length < 2) return;
    mapRef.current.fitToCoordinates(coordinates, { animated: true, edgePadding: { top: 120, right: 60, bottom: 220, left: 60 } });
    // Only refit once when the stop set / initial origin is known, not on
    // every GPS tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, props.initialOrigin]);

  // Camera follows the live position ONLY while "Route starten" is active —
  // outside of that the camera must stay on the fixed overview above (see
  // its comment). No fitToCoordinates here on purpose: a repeated hard
  // re-fit would make the map visibly jump on every GPS tick during a drive.
  //
  // Gated by a minimum-movement distance, not just "position changed": every
  // GPS tick (even a stationary, jittery one) was re-animating the camera,
  // which made it feel jumpy and — since moving/animating the map is what
  // closes an open native Callout on both iOS and Android — kept dismissing
  // the customer callout the moment someone tapped a pin to read it.
  const lastCameraCenterRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const CAMERA_FOLLOW_MIN_DISTANCE_METERS = 20;

  useEffect(() => {
    if (!isLiveNavigating || !delivery.state.currentLocation || !mapRef.current) {
      return;
    }

    const movedMeters = lastCameraCenterRef.current
      ? distanceKm(lastCameraCenterRef.current, delivery.state.currentLocation) * 1000
      : Infinity;

    if (movedMeters < CAMERA_FOLLOW_MIN_DISTANCE_METERS) {
      return;
    }

    lastCameraCenterRef.current = delivery.state.currentLocation;
    mapRef.current.animateCamera({ center: delivery.state.currentLocation, zoom: 16 }, { duration: 500 });
  }, [isLiveNavigating, delivery.state.currentLocation]);

  const wasLiveNavigatingRef = useRef(false);

  useEffect(() => {
    if (wasLiveNavigatingRef.current && !isLiveNavigating && mapRef.current) {
      const coordinates = [
        ...(polylineOrigin ? [polylineOrigin] : []),
        ...markers.map((marker) => ({ latitude: marker.latitude, longitude: marker.longitude })),
      ];
      if (coordinates.length >= 2) {
        mapRef.current.fitToCoordinates(coordinates, { animated: true, edgePadding: { top: 120, right: 60, bottom: 220, left: 60 } });
      }
    }
    wasLiveNavigatingRef.current = isLiveNavigating;
  }, [isLiveNavigating, markers, polylineOrigin]);

  // Screen has headerShown: false (own map/GPS chrome) — every returned state
  // needs its own way back, or the user is stuck until an OS back gesture.
  const closeButton = (
    <SafeAreaView edges={["top"]} pointerEvents="box-none" style={styles.topOverlayCloseOnly}>
      <Pressable
        accessibilityLabel={t("common:close")}
        onPress={() => router.back()}
        style={[styles.closeButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
      >
        <MaterialCommunityIcons color={colors.text} name="close" size={22} />
      </Pressable>
    </SafeAreaView>
  );

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <LoadingView label={t("screen.loading")} />
        {closeButton}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <ErrorState message={error} />
        {closeButton}
      </View>
    );
  }

  if (!markers.length) {
    return (
      <View style={styles.screen}>
        <EmptyState message={t("empty.message")} title={t("empty.title")} />
        {closeButton}
      </View>
    );
  }

  return (
    <AppErrorBoundary>
    <View style={styles.screen}>
      <MapView
        initialRegion={{
          latitude: polylineOrigin?.latitude ?? markers[0].latitude,
          longitude: polylineOrigin?.longitude ?? markers[0].longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        ref={mapRef}
        showsCompass
        showsUserLocation
        style={StyleSheet.absoluteFillObject}
      >
        {polyline.coordinates.length >= 2 ? (
          <Polyline coordinates={polyline.coordinates} strokeColor={routeStroke} strokeWidth={4} />
        ) : null}
        {polylineOrigin ? (
          <Marker coordinate={polylineOrigin} title={t("live.startMarker")}>
            <View style={styles.startPin}>
              <Text style={styles.startPinLabel}>S</Text>
            </View>
          </Marker>
        ) : null}
        {markers.map((marker, index) => (
          <RouteStopMarker active={marker.id === navigation.currentMarker?.id} key={marker.id} label={String(index + 1)} marker={marker} />
        ))}
      </MapView>

      <SafeAreaView edges={["top"]} pointerEvents="box-none" style={styles.topOverlayRow}>
        {/* Only shown once the trip is finished — while a stop is active,
            the marker callout (tap the pin) and the bottom stats card
            already cover name/order/distance, so this header would just
            repeat them. */}
        {!navigation.currentMarker ? (
          <AppCard contentStyle={styles.headerCard} style={styles.headerCardOuter}>
            <AppText variant="subheading">{t("live.allDone")}</AppText>
            {delivery.state.stops.length > 0 ? (
              <AppText color="muted" variant="caption">
                {t("live.summary.completed", { count: delivery.state.stops.filter((stop) => stop.status === "completed").length })}
                {" · "}
                {t("live.summary.skipped", { count: delivery.state.stops.filter((stop) => stop.status === "skipped").length })}
              </AppText>
            ) : null}
          </AppCard>
        ) : null}
        {/* Screen has headerShown: false (own map/GPS chrome), so this is the
            only way back — without it, mid-route there was no exit at all
            besides the OS back gesture. */}
        <Pressable
          accessibilityLabel={t("common:close")}
          onPress={() => router.back()}
          style={[styles.closeButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
        >
          <MaterialCommunityIcons color={colors.text} name="close" size={22} />
        </Pressable>
      </SafeAreaView>

      <SafeAreaView edges={["bottom"]} pointerEvents="box-none" style={styles.bottomOverlay}>
        {navigation.actionError ? <ErrorState message={navigation.actionError} /> : null}
        {delivery.state.error ? <ErrorState message={delivery.state.error} /> : null}
        {navigation.currentMarker && (isLiveNavigating || polyline.currentLegEta || displayDistanceKm !== null) ? (
          <AppCard contentStyle={styles.statsCard}>
            <View style={styles.statColumn}>
              <AppText variant="heading">{effectiveEtaLabel}</AppText>
              <AppText color="muted" variant="caption">
                {t("live.stats.arrival")}
              </AppText>
            </View>
            <View style={styles.statColumn}>
              <AppText variant="heading">{effectiveDurationMinutes !== null ? formatDurationHM(effectiveDurationMinutes) : "--"}</AppText>
              <AppText color="muted" variant="caption">
                {t("live.stats.duration")}
              </AppText>
            </View>
            <View style={styles.statColumn}>
              <AppText variant="heading">{effectiveDistanceKm !== null ? formatDistanceKm(effectiveDistanceKm) : "--"}</AppText>
              <AppText color="muted" variant="caption">
                {t("live.stats.distance")}
              </AppText>
            </View>
          </AppCard>
        ) : null}
        {navigation.currentMarker ? (
          <View style={styles.actionGrid}>
            <View style={styles.actionRow}>
              <View style={styles.actionButton}>
                <DeliveryNavigationControls isNavigating={isLiveNavigating} onEnd={delivery.end} onStart={delivery.start} />
              </View>
              <View style={styles.actionButton}>
                <AppButton label={t("live.skip")} onPress={handleSkip} size="compact" variant="secondary" />
              </View>
            </View>
            <View style={styles.actionRow}>
              <View style={styles.actionButton}>
                <AppButton
                  label={t("live.markComplete")}
                  loading={navigation.completingArrival}
                  onPress={() => void handleMarkComplete()}
                  size="compact"
                />
              </View>
              <View style={styles.actionButton}>
                <AppButton
                  label={t("live.fullNavigationFallbackShort")}
                  onPress={() => {
                    const target = navigation.currentMarker;
                    if (!target || !remainingRouteOrigin) return;
                    // Explicit fixed origin (start location, or the last
                    // completed customer once one has been) -> only the
                    // current customer as destination — never the device's
                    // live position (Google Maps uses that automatically if
                    // no origin is given, which is NOT what's wanted here)
                    // and never the whole remaining list. After marking a
                    // stop done, the next tap routes from that stop to
                    // whichever customer becomes active next.
                    void navigationService.openMultiStopDrivingRoute(remainingRouteOrigin, [
                      { latitude: target.latitude, longitude: target.longitude },
                    ]);
                  }}
                  size="compact"
                  variant="secondary"
                />
              </View>
            </View>
          </View>
        ) : (
          <AppButton label={t("common:close")} onPress={() => router.back()} />
        )}
      </SafeAreaView>

      <ConfirmDialog
        message={t("live.arrivalMessage", { name: navigation.currentMarker?.title ?? "" })}
        onCancel={navigation.dismissArrival}
        onConfirm={() => void handleMarkComplete()}
        title={t("live.arrivalTitle")}
        visible={navigation.arrivalPromptVisible}
      />
    </View>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topOverlayRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  topOverlayCloseOnly: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: spacing.sm,
    alignItems: "flex-end",
  },
  headerCardOuter: { flex: 1 },
  headerCard: { padding: spacing.md, gap: spacing.xxs, borderRadius: radius.card },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, padding: spacing.xs, gap: spacing.xxs },
  statsCard: { flexDirection: "row", padding: spacing.sm, borderRadius: radius.card },
  statColumn: { flex: 1, alignItems: "center", gap: spacing.xxs },
  actionGrid: { gap: spacing.xxs },
  actionRow: { flexDirection: "row", gap: spacing.xxs },
  actionButton: { flex: 1 },
  startPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  startPinLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});

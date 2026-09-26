import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppErrorBoundary } from "@/src/components/layout/AppErrorBoundary";
import { AppText } from "@/src/components/ui/AppText";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { routeT } from "@/src/features/route/i18n/routeT";
import { RouteMoveStopDialog } from "@/src/features/route/components/RouteMoveStopDialog";
import { RouteReorderSheet } from "@/src/features/route/components/RouteReorderSheet";
import { RouteStartPin } from "@/src/features/route/components/RouteStartPin";
import { RouteStopMarker } from "@/src/features/route/components/RouteStopMarker";
import { RoutePolyline } from "@/src/features/route/components/RoutePolyline";
import { useLiveLocation } from "@/src/features/route/hooks/useLiveLocation";
import { useLiveRouteMarkers } from "@/src/features/route/hooks/useLiveRouteMarkers";
import { useMovementAnchor } from "@/src/features/route/hooks/useMovementAnchor";
import { useRouteLiveNavigation } from "@/src/features/route/hooks/useRouteLiveNavigation";
import { useRoutePolyline } from "@/src/features/route/hooks/useRoutePolyline";
import { useRouteOrder } from "@/src/features/route/hooks/useRouteOrder";
import { moveIdToPosition } from "@/src/features/route/services/routeManualOrderService";
import { formatDistanceKm, formatDurationHM, formatEtaTime } from "@/src/features/route/utils/routeFormat";
import { AppMapView } from "@/src/features/map/components/AppMapView";
import { ContactMethodSheet } from "@/src/features/map/components/ContactMethodSheet";
import { MapCustomerSheet } from "@/src/features/map/components/MapCustomerSheet";
import { useMapActions } from "@/src/features/map/hooks/useMapActions";
import { useMapCustomerDetails } from "@/src/features/map/hooks/useMapCustomerDetails";
import { useDriverLiveStatus } from "@/src/features/map/hooks/useDriverLiveStatus";
import { AppMapViewHandle } from "@/src/features/map/types/mapViewTypes";
import { isDriver } from "@/src/features/auth/permissions";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { navigationService } from "@/src/services/navigationService";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

// Remaining km/duration/ETA are recalculated from the live position only
// after this much movement (one Directions request per recalculation).
const LIVE_ORIGIN_MIN_METERS = 500;

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
  const driverLiveStatus = useDriverLiveStatus();
  const currentUser = useCurrentUser();
  const isCurrentUserDriver = isDriver(currentUser);
  // The person's own saved list (see RouteScreen) — a mid-drive re-sort is
  // kept there too, so it survives the trip and the admin sees it live.
  const routeOrder = useRouteOrder(currentUser?.uid ?? null);
  const mapRef = useRef<AppMapViewHandle | null>(null);
  // Read by useLiveRouteMarkers only when a new assignment arrives, so
  // mid-drive additions land after the stop the driver is heading to now.
  const currentStopIdRef = useRef<string | null>(null);
  const getCurrentStopId = useCallback(() => currentStopIdRef.current, []);
  const {
    markers,
    isLoading,
    error,
    addedMarkers,
    dismissAdded,
    reorderPending,
  } = useLiveRouteMarkers(props.orderedIds, isCurrentUserDriver, getCurrentStopId);
  // Only used for the one-time camera fit below (stop set, not order).
  const orderedMarkers = markers;
  // Must match the pin numbers rendered on the map below (also indexed off
  // `markers`), so the customer list's numbers agree with the pins.
  const stopNumberById = useMemo(() => new Map(markers.map((marker, index) => [marker.id, index + 1])), [markers]);
  const live = useLiveLocation();
  const polylineOrigin = props.initialOrigin ?? live.coordinate;
  const navigation = useRouteLiveNavigation(markers, live.coordinate);
  const [reorderSheetVisible, setReorderSheetVisible] = useState(false);
  // Bottom action panel starts collapsed so the map stays visible.
  const [actionsOpen, setActionsOpen] = useState(false);
  const [moveStopId, setMoveStopId] = useState<string | null>(null);
  // Pin numbers of the remaining stops start after the already-handled ones.
  const pendingNumberOffset = markers.length - navigation.pendingMarkers.length;
  const moveStopNumber = moveStopId ? stopNumberById.get(moveStopId) ?? null : null;
  // Remaining km/duration/ETA always come from where the driver actually
  // is — there's no separate "start the trip" step anymore (turn-by-turn is
  // Google Maps' job). Refreshed only every LIVE_ORIGIN_MIN_METERS of
  // movement, so a jittery fix doesn't fire a Directions request each tick.
  // Until the first fix: the last completed stop, else the start chosen on
  // the list screen, with that screen's departure time.
  const liveAnchor = useMovementAnchor(live.coordinate, LIVE_ORIGIN_MIN_METERS);
  const remainingRouteOrigin = liveAnchor?.coordinate ?? navigation.legOrigin ?? polylineOrigin;
  const [screenOpenedAt] = useState(() => new Date());
  const etaAnchor = liveAnchor?.at ?? props.initialDepartureTime ?? screenOpenedAt;
  const polyline = useRoutePolyline(remainingRouteOrigin, navigation.pendingMarkers, etaAnchor);
  const etaLabel = polyline.currentLegEta ? formatEtaTime(polyline.currentLegEta) : "--:--";

  async function handleMarkComplete() {
    await navigation.confirmArrival();
  }

  function handleSkip(customerId = navigation.currentMarker?.id) {
    if (!customerId) return;

    if (customerId === navigation.currentMarker?.id) {
      navigation.skipStop();
      return;
    }

    navigation.skipToMarker(customerId);
  }

  // Mid-drive re-sort of the remaining stops (RouteReorderSheet) — reaches
  // useRouteLiveNavigation through `markers`, so the first remaining stop
  // becomes the next target. Also saved as the person's own list.
  function movePendingStop(customerId: string, pendingPosition: number) {
    const pendingIds = navigation.pendingMarkers.map((marker) => marker.id);
    const nextIds = moveIdToPosition(pendingIds, customerId, pendingPosition);
    if (nextIds === pendingIds) return;
    reorderPending(nextIds);
    void routeOrder.save(nextIds);
  }

  useEffect(() => {
    currentStopIdRef.current = navigation.currentMarker?.id ?? null;
  }, [navigation.currentMarker]);

  // Mirrors the trip in progress for the driver's admin (DriverLiveMapScreen):
  // the remaining stops in driving order and the next one. Re-sent whenever
  // that changes (stop done/skipped, re-sort, stop added/hidden), cleared
  // when the driver leaves this screen.
  const saveTrip = routeOrder.saveTrip;
  const pendingTripKey = navigation.pendingMarkers.map((marker) => marker.id).join(",");
  const currentTripStopId = navigation.currentMarker?.id ?? null;
  useEffect(() => {
    if (!isCurrentUserDriver || isLoading) return;
    void saveTrip({ customerIds: pendingTripKey ? pendingTripKey.split(",") : [], currentCustomerId: currentTripStopId });
  }, [isCurrentUserDriver, isLoading, pendingTripKey, currentTripStopId, saveTrip]);
  useEffect(() => {
    if (!isCurrentUserDriver) return;
    return () => void saveTrip(null);
  }, [isCurrentUserDriver, saveTrip]);

  // Tapping any stop pin opens the same customer detail sheet as the plain
  // map screen (name/address/note/open order + edit/call/navigate/share),
  // instead of the old native map Callout — see RouteStopMarker for why that
  // was flaky here specifically. Loaded independently of the route's own
  // sequencing state, so it works for any tapped stop, not just the active
  // one.
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [sheetCompleteConfirmVisible, setSheetCompleteConfirmVisible] = useState(false);
  const [sheetSkipConfirmVisible, setSheetSkipConfirmVisible] = useState(false);
  const selectedMarker = markers.find((marker) => marker.id === selectedCustomerId) ?? null;
  // Completing/skipping an out-of-sequence stop from here would fight with
  // the leg-by-leg polyline/navigation, which always targets currentMarker —
  // so those two actions stay limited to whichever stop is actually active,
  // same as the bottom action bar. Every other action (edit/call/navigate/
  // share) works for any tapped stop regardless of sequence.
  const isSelectedCurrentStop = selectedMarker !== null && selectedMarker.id === navigation.currentMarker?.id;
  const isSelectedPendingFutureStop =
    selectedMarker !== null &&
    !isSelectedCurrentStop &&
    !navigation.handledIds.has(selectedMarker.id) &&
    navigation.pendingMarkers.some((marker) => marker.id === selectedMarker.id);
  // Undoing a skip/complete for a stop that was already handled.
  const canReactivateSelected = selectedMarker !== null && navigation.handledIds.has(selectedMarker.id);
  const sheetDetails = useMapCustomerDetails(selectedCustomerId);
  const sheetActions = useMapActions(sheetDetails.details, selectedMarker);

  function closeSheet() {
    setSelectedCustomerId(null);
    setSheetCompleteConfirmVisible(false);
    setSheetSkipConfirmVisible(false);
  }

  // The camera fits the planned route (chosen origin + stops) once and then
  // stays there — it must never auto-pan to the device's live GPS position,
  // which can be far off (simulator, stale/no fix, ...) and drag the view
  // away from the route the driver is actually looking at.
  useEffect(() => {
    if (!mapRef.current) return;
    const coordinates = [
      ...(polylineOrigin ? [polylineOrigin] : []),
      ...orderedMarkers.map((marker) => ({ latitude: marker.latitude, longitude: marker.longitude })),
    ];
    if (coordinates.length < 2) return;
    mapRef.current.fitToCoordinates(coordinates, { animated: true, edgePadding: { top: 120, right: 60, bottom: 220, left: 60 } });
    // Only refit once when the stop set / initial origin is known, not on
    // every GPS tick — orderedMarkers (not the possibly-reordered `markers`)
    // on purpose: changing the last-stop override changes visiting ORDER,
    // not the geographic bounding box, so it shouldn't re-trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedMarkers, props.initialOrigin]);

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
      <AppMapView
        initialRegion={{
          latitude: polylineOrigin?.latitude ?? markers[0].latitude,
          longitude: polylineOrigin?.longitude ?? markers[0].longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        ref={mapRef}
        showsCompass
        showsUserLocation
        style={StyleSheet.absoluteFill}
        userLocationCoordinate={live.coordinate}
      >
        {polyline.coordinates.length >= 2 ? <RoutePolyline coordinates={polyline.coordinates} /> : null}
        {polylineOrigin ? <RouteStartPin coordinate={polylineOrigin} title={t("live.startMarker")} /> : null}
        {markers.map((marker, index) => (
          <RouteStopMarker
            active={marker.id === navigation.currentMarker?.id}
            inactive={navigation.handledIds.has(marker.id)}
            key={marker.id}
            label={String(index + 1)}
            marker={marker}
            onPress={setSelectedCustomerId}
            skipped={navigation.skippedIds.has(marker.id)}
          />
        ))}
      </AppMapView>

      <SafeAreaView edges={["top"]} pointerEvents="box-none" style={styles.topOverlayRow}>
        {/* Only shown once the trip is finished — while a stop is active,
            the marker callout (tap the pin) and the bottom stats card
            already cover name/order/distance, so this header would just
            repeat them. */}
        <View style={styles.topCards}>
          {addedMarkers.length ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSelectedCustomerId(addedMarkers[0].id);
                dismissAdded();
              }}
            >
              <AppCard contentStyle={[styles.headerCard, styles.addedCard]} style={{ borderColor: colors.primary }}>
                <MaterialCommunityIcons color={colors.primary} name="bell-ring-outline" size={22} />
                <View style={styles.addedText}>
                  <AppText variant="subheading">{t("live.newStops.title", { count: addedMarkers.length })}</AppText>
                  <AppText color="muted" numberOfLines={2} variant="caption">
                    {addedMarkers.map((marker) => `${stopNumberById.get(marker.id) ?? "?"}. ${marker.title}`).join(", ")}
                  </AppText>
                </View>
                <Pressable accessibilityLabel={t("common:close")} hitSlop={12} onPress={dismissAdded}>
                  <MaterialCommunityIcons color={colors.textMuted} name="close" size={20} />
                </Pressable>
              </AppCard>
            </Pressable>
          ) : null}
          {!navigation.currentMarker ? (
            <AppCard contentStyle={styles.headerCard}>
              <AppText variant="subheading">{t("live.allDone")}</AppText>
              {navigation.handledIds.size > 0 ? (
                <AppText color="muted" variant="caption">
                  {t("live.summary.completed", { count: navigation.handledIds.size - navigation.skippedIds.size })}
                  {" · "}
                  {t("live.summary.skipped", { count: navigation.skippedIds.size })}
                </AppText>
              ) : null}
            </AppCard>
          ) : null}
        </View>
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
        {driverLiveStatus.error ? <ErrorState message={driverLiveStatus.error} /> : null}
        {navigation.currentMarker && (polyline.currentLegEta || polyline.currentLegDistanceKm !== null) ? (
          <AppCard contentStyle={styles.statsCard}>
            <View style={styles.statColumn}>
              <AppText variant="heading">{etaLabel}</AppText>
              <AppText color="muted" variant="caption">
                {t("live.stats.arrival")}
              </AppText>
            </View>
            <View style={styles.statColumn}>
              <AppText variant="heading">
                {polyline.currentLegDurationMinutes !== null ? formatDurationHM(polyline.currentLegDurationMinutes) : "--"}
              </AppText>
              <AppText color="muted" variant="caption">
                {t("live.stats.duration")}
              </AppText>
            </View>
            <View style={styles.statColumn}>
              <AppText variant="heading">
                {polyline.currentLegDistanceKm !== null ? formatDistanceKm(polyline.currentLegDistanceKm) : "--"}
              </AppText>
              <AppText color="muted" variant="caption">
                {t("live.stats.distance")}
              </AppText>
            </View>
          </AppCard>
        ) : null}
        {navigation.currentMarker ? (
          <View style={styles.actionGrid}>
            {/* One compact toggle instead of a wall of buttons over the map —
                every stop action lives in this panel. */}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: actionsOpen }}
              onPress={() => setActionsOpen((open) => !open)}
              style={[styles.actionsToggle, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            >
              <AppText numberOfLines={1} style={styles.actionsToggleLabel} variant="bodyMedium">
                {t("live.actionsMenu", { name: navigation.currentMarker.title })}
              </AppText>
              <MaterialCommunityIcons color={colors.text} name={actionsOpen ? "chevron-down" : "chevron-up"} size={22} />
            </Pressable>
            {actionsOpen ? (
            <>
            {navigation.pendingMarkers.length > 1 ? (
              <AppButton
                label={t("reorderSheet.open", { count: navigation.pendingMarkers.length })}
                onPress={() => {
                  setActionsOpen(false);
                  setReorderSheetVisible(true);
                }}
                size="compact"
                variant="secondary"
              />
            ) : null}
            <View style={styles.actionRow}>
              <View style={styles.actionButton}>
                <AppButton
                  label={t("live.markComplete")}
                  loading={navigation.completingArrival}
                  onPress={() => {
                    setActionsOpen(false);
                    void handleMarkComplete();
                  }}
                  size="compact"
                />
              </View>
              <View style={styles.actionButton}>
                <AppButton
                  label={t("live.skip")}
                  onPress={() => {
                    setActionsOpen(false);
                    handleSkip();
                  }}
                  size="compact"
                  variant="secondary"
                />
              </View>
            </View>
            {/* The actual turn-by-turn navigation: Google Maps, only to the
                current customer (never the whole remaining list), starting
                from the same origin the km/ETA above are measured from. */}
            <AppButton
              label={t("live.fullNavigationFallbackShort")}
              onPress={() => {
                const target = navigation.currentMarker;
                if (!target || !remainingRouteOrigin) return;
                setActionsOpen(false);
                void navigationService.openMultiStopDrivingRoute(remainingRouteOrigin, [
                  { latitude: target.latitude, longitude: target.longitude },
                ]);
              }}
              size="compact"
              variant="secondary"
            />
            {isCurrentUserDriver ? (
              <AppButton
                label={t("map:driverStatus.updateLocation")}
                loading={driverLiveStatus.updating}
                onPress={() => void driverLiveStatus.sendLocationUpdate()}
                size="compact"
                variant="secondary"
              />
            ) : null}
            </>
            ) : null}
          </View>
        ) : (
          <AppButton label={t("common:close")} onPress={() => router.back()} />
        )}
      </SafeAreaView>

      <RouteReorderSheet
        currentStopId={navigation.currentMarker?.id ?? null}
        onClose={() => setReorderSheetVisible(false)}
        onMove={movePendingStop}
        onPressPosition={setMoveStopId}
        pendingMarkers={navigation.pendingMarkers}
        stopNumberById={stopNumberById}
        visible={reorderSheetVisible && moveStopId === null}
      />
      <RouteMoveStopDialog
        key={moveStopId ?? "closed"}
        onCancel={() => setMoveStopId(null)}
        onConfirm={(position) => {
          if (moveStopId) movePendingStop(moveStopId, position - pendingNumberOffset);
          setMoveStopId(null);
        }}
        stop={
          moveStopId && moveStopNumber !== null
            ? { name: markers.find((marker) => marker.id === moveStopId)?.title ?? "", position: moveStopNumber }
            : null
        }
        totalCount={markers.length}
      />
      <ConfirmDialog
        message={t("live.arrivalMessage", { name: navigation.currentMarker?.title ?? "" })}
        onCancel={navigation.dismissArrival}
        onConfirm={() => void handleMarkComplete()}
        title={t("live.arrivalTitle")}
        visible={navigation.arrivalPromptVisible}
      />

      <MapCustomerSheet
        actionError={sheetActions.actionError}
        actionSuccess={sheetActions.actionSuccess}
        completing={navigation.completingArrival}
        details={sheetDetails.details}
        error={sheetDetails.error}
        loading={sheetDetails.isLoading}
        onCall={() => void sheetActions.callCustomer()}
        onClose={closeSheet}
        onComplete={isSelectedCurrentStop ? () => setSheetCompleteConfirmVisible(true) : undefined}
        onEdit={() => {
          if (selectedCustomerId) router.push(`/customer/edit/${selectedCustomerId}`);
        }}
        onNavigate={() => void sheetActions.openNavigationMenu()}
        onReactivate={
          canReactivateSelected && selectedCustomerId
            ? () => {
                navigation.reactivateStop(selectedCustomerId);
                closeSheet();
              }
            : undefined
        }
        onRetry={() => void sheetDetails.reload()}
        onShare={() => void sheetActions.shareLocation()}
        onShareOrder={() => void sheetActions.shareOrder()}
        onSkip={isSelectedCurrentStop || isSelectedPendingFutureStop ? () => setSheetSkipConfirmVisible(true) : undefined}
        onSkipLabel={isSelectedPendingFutureStop ? t("live.skipToStop") : undefined}
        visible={
          selectedCustomerId !== null &&
          !sheetCompleteConfirmVisible &&
          !sheetSkipConfirmVisible &&
          !navigation.arrivalPromptVisible
        }
      />
      <ContactMethodSheet
        onCallPhone={() => void sheetActions.callByPhone()}
        onCallWhatsapp={() => void sheetActions.callByWhatsapp()}
        onClose={sheetActions.closeContactSheet}
        visible={sheetActions.contactSheetVisible}
      />
      <ConfirmDialog
        message={t("map:sheet.completeConfirmMessage")}
        onCancel={() => setSheetCompleteConfirmVisible(false)}
        onConfirm={() => {
          setSheetCompleteConfirmVisible(false);
          closeSheet();
          void handleMarkComplete();
        }}
        title={t("map:sheet.completeConfirmTitle")}
        visible={sheetCompleteConfirmVisible}
      />
      <ConfirmDialog
        message={t("map:sheet.skipConfirmMessage")}
        onCancel={() => setSheetSkipConfirmVisible(false)}
        onConfirm={() => {
          setSheetSkipConfirmVisible(false);
          closeSheet();
          handleSkip(selectedCustomerId ?? undefined);
        }}
        title={t("map:sheet.skipConfirmTitle")}
        visible={sheetSkipConfirmVisible}
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
  topCards: { flex: 1, gap: spacing.xs },
  headerCard: { padding: spacing.md, gap: spacing.xxs, borderRadius: radius.card },
  addedCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  addedText: { flex: 1, gap: spacing.xxs },
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
  actionsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.card,
  },
  actionsToggleLabel: { flex: 1 },
  actionRow: { flexDirection: "row", gap: spacing.xxs },
  actionButton: { flex: 1 },
});

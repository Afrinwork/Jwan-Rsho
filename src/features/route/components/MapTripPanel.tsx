import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { isDriver } from "@/src/features/auth/permissions";
import { useDriverLiveStatus } from "@/src/features/map/hooks/useDriverLiveStatus";
import { RouteLastStopDropdown } from "@/src/features/route/components/RouteLastStopDropdown";
import { RouteMoveStopDialog } from "@/src/features/route/components/RouteMoveStopDialog";
import { RouteReorderSheet } from "@/src/features/route/components/RouteReorderSheet";
import { RouteTimeDropdown } from "@/src/features/route/components/RouteTimeDropdown";
import { TripActionDockButton } from "@/src/features/route/components/TripActionDockButton";
import { TripActionMenu } from "@/src/features/route/components/TripActionMenu";
import { TripStartLocationDialog } from "@/src/features/route/components/TripStartLocationDialog";
import { useMapTrip } from "@/src/features/route/hooks/useMapTrip";
import { routeT } from "@/src/features/route/i18n/routeT";
import { STOP_SERVICE_BUFFER_SEC } from "@/src/features/route/services/routeDirectionsService";
import { formatDistanceKm, formatDurationHM, formatEtaTime } from "@/src/features/route/utils/routeFormat";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { navigationService } from "@/src/services/navigationService";
import { useAppStore } from "@/src/store/appStore";
import { spacing } from "@/src/theme/spacing";

// railOnly: just the actions button (and the menu it opens), without the
// trip stats — shown on the map before "my trip" is opened.
type MapTripPanelProps = { trip: ReturnType<typeof useMapTrip>; railOnly?: boolean };
type ActionSection = "stop" | "order" | "departure" | "settings";

const QUARTER_HOUR_MS = 15 * 60 * 1000;

// The departure picker offers 15-minute steps; "now" preselects the next one.
function nextQuarterHour() {
  return formatEtaTime(new Date(Math.ceil(Date.now() / QUARTER_HOUR_MS) * QUARTER_HOUR_MS));
}

export function MapTripPanel({ trip, railOnly = false }: MapTripPanelProps) {
  const t = routeT;
  const isCurrentUserDriver = isDriver(useCurrentUser());
  const preferredNavigationApp = useAppStore((state) => state.preferredNavigationApp);
  const driverLiveStatus = useDriverLiveStatus();
  const { navigation, polyline } = trip;
  const current = navigation.currentMarker;
  const [openSection, setOpenSection] = useState<ActionSection | null>(null);
  const [showAllConfirmVisible, setShowAllConfirmVisible] = useState(false);
  const [reorderSheetVisible, setReorderSheetVisible] = useState(false);
  const [moveStopId, setMoveStopId] = useState<string | null>(null);
  const [startLocationVisible, setStartLocationVisible] = useState(false);
  const [railOpen, setRailOpen] = useState(false);

  const stopNumberById = useMemo(
    () => new Map(trip.orderedMarkers.map((marker, index) => [marker.id, index + 1])),
    [trip.orderedMarkers],
  );
  const pendingCount = navigation.pendingMarkers.length;
  const pendingNumberOffset = trip.orderedMarkers.length - pendingCount;
  const moveStopNumber = moveStopId ? stopNumberById.get(moveStopId) ?? null : null;
  const lastStopOptions = navigation.pendingMarkers.map((marker) => ({
    id: marker.id,
    name: `${stopNumberById.get(marker.id) ?? "?"}. ${marker.title}`,
  }));
  const hasSettings = pendingCount > 1 || isCurrentUserDriver || trip.started;
  // The trip stats only show for a started trip (drawn selection → start);
  // before that, and after going back to all customers, just the actions.
  const showStats = !railOnly && trip.started;

  if (!trip.ready || (!trip.orderedMarkers.length && trip.scopeCount === null)) return null;

  function toggleSection(section: ActionSection) {
    setOpenSection((active) => active === section ? null : section);
  }

  function pickFromRail(action: () => void) {
    setRailOpen(false);
    action();
  }

  function resortButton(kind: Parameters<typeof trip.resort>[0], label: string) {
    return (
      <AppButton
        disabled={trip.resorting !== null}
        label={label}
        loading={trip.resorting === kind}
        onPress={() => trip.resort(kind)}
        size="compact"
        variant="secondary"
      />
    );
  }

  function scopeButton() {
    if (trip.scopeCount === null) return null;
    return (
      <TripActionDockButton
        active={false}
        badge={trip.scopeCount}
        icon="target"
        label={t("live.showAllCustomers")}
        onPress={() => setShowAllConfirmVisible(true)}
      />
    );
  }

  function renderActionMenu() {
    if (!current || !openSection) return null;
    const close = () => setOpenSection(null);

    if (openSection === "departure") {
      return (
        <TripActionMenu
          icon="clock-outline"
          onClose={close}
          subtitle={t("live.actionCategories.departureHint", { minutes: STOP_SERVICE_BUFFER_SEC / 60 })}
          title={t("live.actionCategories.startAndTime")}
        >
          <View style={styles.lastStopRow}>
            <AppText color="muted" variant="label">{t("startCard.title")}</AppText>
            <AppButton
              label={trip.startLocation?.label ?? t("startCard.currentLocationLabel")}
              onPress={() => { close(); setStartLocationVisible(true); }}
              size="compact"
              variant="secondary"
            />
          </View>
          <AppButton
            label={t("live.departureNow")}
            onPress={() => { close(); trip.chooseDepartureTime(null); }}
            size="compact"
            variant={trip.departureTime ? "secondary" : "primary"}
          />
          <View style={styles.lastStopRow}>
            <AppText color="muted" variant="label">{t("startCard.departureTimeLabel")}</AppText>
            <RouteTimeDropdown onChange={trip.chooseDepartureTime} value={trip.departureTime ?? nextQuarterHour()} />
          </View>
        </TripActionMenu>
      );
    }

    if (openSection === "stop") {
      return (
        <TripActionMenu
          icon="map-marker-check-outline"
          onClose={close}
          subtitle={t("live.actionCategories.currentStopHint")}
          title={t("live.actionCategories.currentStop", { name: `${stopNumberById.get(current.id) ?? ""}. ${current.title}` })}
        >
          <AppButton label={t("live.markComplete")} loading={navigation.completingArrival} onPress={() => { close(); void navigation.confirmArrival(); }} size="compact" />
          <AppButton label={t("live.skip")} onPress={() => { close(); trip.skipStop(); }} size="compact" variant="secondary" />
          <AppButton
            label={t("live.fullNavigationFallbackShort")}
            onPress={() => {
              close();
              // Single stop, so every app works -- uses the one chosen in Settings.
              void navigationService
                .openNavigationApp(preferredNavigationApp, { latitude: current.latitude, longitude: current.longitude })
                .catch(() => undefined);
            }}
            size="compact"
            variant="secondary"
          />
        </TripActionMenu>
      );
    }

    if (openSection === "order") {
      return (
        <TripActionMenu icon="sort-variant" onClose={close} subtitle={t("live.actionCategories.routeOrderHint")} title={t("live.actionCategories.routeOrder")}>
          <AppButton
            label={t("reorderSheet.open", { count: pendingCount })}
            onPress={() => { close(); setReorderSheetVisible(true); }}
            size="compact"
            variant="secondary"
          />
          {resortButton("variant", t("live.newRoute"))}
          {pendingCount > 2 ? resortButton("optimize", t("live.reoptimizeRest")) : null}
          {resortButton("nearest", t("sortMode.nearest"))}
          {resortButton("farthest", t("sortMode.farthest"))}
          {resortButton("city", t("sortMode.city"))}
        </TripActionMenu>
      );
    }

    return (
      <TripActionMenu icon="tune-variant" onClose={close} subtitle={t("live.actionCategories.settingsHint")} title={t("live.actionCategories.settings")}>
        {pendingCount > 1 ? (
          <View style={styles.lastStopRow}>
            <AppText color="muted" variant="label">{t("startCard.lastStopLabel")}</AppText>
            <RouteLastStopDropdown onChange={trip.chooseLastStop} options={lastStopOptions} value={trip.lastStopId} />
          </View>
        ) : null}
        {isCurrentUserDriver ? (
          <AppButton
            label={t("map:driverStatus.updateLocation")}
            loading={driverLiveStatus.updating}
            onPress={() => void driverLiveStatus.sendLocationUpdate()}
            size="compact"
            variant="secondary"
          />
        ) : null}
        {trip.started ? (
          <AppButton label={t("live.endNavigation")} onPress={() => { close(); trip.endTrip(); }} size="compact" variant="secondary" />
        ) : null}
      </TripActionMenu>
    );
  }

  return (
    <>
      <View pointerEvents="box-none" style={styles.panel}>
        {navigation.actionError ? <ErrorState message={navigation.actionError} /> : null}
        {driverLiveStatus.error ? <ErrorState message={driverLiveStatus.error} /> : null}
        {renderActionMenu()}

        {!current ? (
          !showStats ? null : <View style={styles.dockRow}>
            <AppCard contentStyle={styles.doneCard} style={styles.statsDock}>
              <AppText variant="subheading">{t("live.allDone")}</AppText>
              <AppText color="muted" variant="caption">
                {t("live.summary.completed", { count: navigation.handledIds.size })}
              </AppText>
            </AppCard>
            {trip.scopeCount !== null ? <View style={styles.iconRail}>{scopeButton()}</View> : null}
          </View>
        ) : (
          <View pointerEvents="box-none" style={styles.dockRow}>
            {!showStats ? <View pointerEvents="none" style={styles.statsDock} /> : <View style={styles.statsDock}>
              <AppCard contentStyle={styles.statsCard}>
                <Stat label={t("live.stats.arrival")} value={polyline.currentLegEta ? formatEtaTime(polyline.currentLegEta) : "--:--"} />
                <Stat label={t("live.stats.duration")} value={polyline.currentLegDurationMinutes !== null ? formatDurationHM(polyline.currentLegDurationMinutes) : "--"} />
                <Stat label={t("live.stats.distance")} value={polyline.currentLegDistanceKm !== null ? formatDistanceKm(polyline.currentLegDistanceKm) : "--"} />
              </AppCard>
            </View>}
            {/* All actions sit behind one button so the map stays clear;
                picking one folds the rail back up. */}
            <View style={styles.iconRail}>
              {railOpen ? (
                <>
                  {scopeButton()}
                  {/* From where and when, under one button. */}
                  <TripActionDockButton
                    active={openSection === "departure" || startLocationVisible || trip.departureTime !== null || trip.startLocation !== null}
                    icon="clock-outline"
                    label={t("live.actionCategories.startAndTime")}
                    onPress={() => pickFromRail(() => toggleSection("departure"))}
                  />
                  <TripActionDockButton
                    active={openSection === "stop"}
                    icon="map-marker-check-outline"
                    label={t("live.actionCategories.currentStop", { name: current.title })}
                    onPress={() => pickFromRail(() => toggleSection("stop"))}
                  />
                  {/* The customer list with drag-to-reorder, one tap away — not
                      only from inside the "order" menu. */}
                  {pendingCount > 1 ? (
                    <TripActionDockButton
                      active={reorderSheetVisible}
                      icon="format-list-numbered"
                      label={t("reorderSheet.open", { count: pendingCount })}
                      onPress={() => pickFromRail(() => {
                        setOpenSection(null);
                        setReorderSheetVisible(true);
                      })}
                    />
                  ) : null}
                  {pendingCount > 1 ? (
                    <TripActionDockButton
                      active={openSection === "order"}
                      badge={pendingCount}
                      icon="sort-variant"
                      label={t("live.actionCategories.routeOrder")}
                      onPress={() => pickFromRail(() => toggleSection("order"))}
                    />
                  ) : null}
                  {hasSettings ? (
                    <TripActionDockButton
                      active={openSection === "settings"}
                      icon="tune-variant"
                      label={t("live.actionCategories.settings")}
                      onPress={() => pickFromRail(() => toggleSection("settings"))}
                    />
                  ) : null}
                </>
              ) : null}
              <TripActionDockButton
                active={railOpen}
                icon={railOpen ? "close" : "dots-grid"}
                label={t("live.actionCategories.allActions")}
                onPress={() => setRailOpen((open) => !open)}
              />
            </View>
          </View>
        )}
      </View>

      <TripStartLocationDialog
        onChange={trip.chooseStartLocation}
        onClose={() => setStartLocationVisible(false)}
        value={trip.startLocation}
        visible={startLocationVisible}
      />
      <RouteReorderSheet
        currentStopId={current?.id ?? null}
        etaById={trip.etaById}
        onClose={() => setReorderSheetVisible(false)}
        onMove={trip.movePendingStop}
        onPressPosition={setMoveStopId}
        pendingMarkers={navigation.pendingMarkers}
        stopNumberById={stopNumberById}
        visible={reorderSheetVisible && moveStopId === null}
      />
      <RouteMoveStopDialog
        key={moveStopId ?? "closed"}
        onCancel={() => setMoveStopId(null)}
        onConfirm={(position) => {
          if (moveStopId) trip.movePendingStop(moveStopId, position - pendingNumberOffset);
          setMoveStopId(null);
        }}
        stop={moveStopId && moveStopNumber !== null
          ? { name: trip.orderedMarkers.find((marker) => marker.id === moveStopId)?.title ?? "", position: moveStopNumber }
          : null}
        totalCount={trip.orderedMarkers.length}
      />
      <ConfirmDialog
        confirmLabel={t("live.showAllConfirm.confirm")}
        message={t("live.showAllConfirm.message")}
        onCancel={() => setShowAllConfirmVisible(false)}
        onConfirm={() => {
          setShowAllConfirmVisible(false);
          trip.showAllCustomers();
        }}
        title={t("live.showAllConfirm.title")}
        visible={showAllConfirmVisible}
      />
      <ConfirmDialog
        message={t("live.arrivalMessage", { name: current?.title ?? "" })}
        onCancel={navigation.dismissArrival}
        onConfirm={() => void navigation.confirmArrival()}
        title={t("live.arrivalTitle")}
        visible={navigation.arrivalPromptVisible}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statColumn}>
      <AppText numberOfLines={1} variant="subheading">{value}</AppText>
      <AppText color="muted" numberOfLines={1} variant="caption">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing.sm },
  dockRow: { alignItems: "flex-end", flexDirection: "row", gap: spacing.sm },
  statsDock: { flex: 1, gap: spacing.xs },
  statsCard: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
  statColumn: { alignItems: "center", flex: 1, gap: 2 },
  iconRail: { gap: spacing.xs },
  doneCard: { gap: spacing.xxs, padding: spacing.md },
  lastStopRow: { gap: spacing.xs },
});

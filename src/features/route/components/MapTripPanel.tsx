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
import { TripActionDockButton } from "@/src/features/route/components/TripActionDockButton";
import { TripActionMenu } from "@/src/features/route/components/TripActionMenu";
import { useMapTrip } from "@/src/features/route/hooks/useMapTrip";
import { routeT } from "@/src/features/route/i18n/routeT";
import { formatDistanceKm, formatDurationHM, formatEtaTime } from "@/src/features/route/utils/routeFormat";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { navigationService } from "@/src/services/navigationService";
import { useAppStore } from "@/src/store/appStore";
import { spacing } from "@/src/theme/spacing";

type MapTripPanelProps = { trip: ReturnType<typeof useMapTrip> };
type ActionSection = "stop" | "order" | "settings";

export function MapTripPanel({ trip }: MapTripPanelProps) {
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
  const hasSettings = pendingCount > 1 || isCurrentUserDriver;

  if (!trip.ready || (!trip.orderedMarkers.length && trip.scopeCount === null)) return null;

  function toggleSection(section: ActionSection) {
    setOpenSection((active) => active === section ? null : section);
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

    if (openSection === "stop") {
      return (
        <TripActionMenu
          icon="map-marker-check-outline"
          onClose={close}
          subtitle={t("live.actionCategories.currentStopHint")}
          title={t("live.actionCategories.currentStop", { name: `${stopNumberById.get(current.id) ?? ""}. ${current.title}` })}
        >
          <AppButton label={t("live.markComplete")} loading={navigation.completingArrival} onPress={() => { close(); void navigation.confirmArrival(); }} size="compact" />
          <AppButton label={t("live.skip")} onPress={() => { close(); navigation.skipStop(); }} size="compact" variant="secondary" />
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
      </TripActionMenu>
    );
  }

  return (
    <>
      <View style={styles.panel}>
        {navigation.actionError ? <ErrorState message={navigation.actionError} /> : null}
        {driverLiveStatus.error ? <ErrorState message={driverLiveStatus.error} /> : null}
        {renderActionMenu()}

        {!current ? (
          <View style={styles.dockRow}>
            <AppCard contentStyle={styles.doneCard} style={styles.statsDock}>
              <AppText variant="subheading">{t("live.allDone")}</AppText>
              <AppText color="muted" variant="caption">
                {t("live.summary.completed", { count: navigation.handledIds.size - navigation.skippedIds.size })}
                {" · "}
                {t("live.summary.skipped", { count: navigation.skippedIds.size })}
              </AppText>
            </AppCard>
            {trip.scopeCount !== null ? <View style={styles.iconRail}>{scopeButton()}</View> : null}
          </View>
        ) : (
          <View style={styles.dockRow}>
            <AppCard contentStyle={styles.statsCard} style={styles.statsDock}>
              <Stat label={t("live.stats.arrival")} value={polyline.currentLegEta ? formatEtaTime(polyline.currentLegEta) : "--:--"} />
              <Stat label={t("live.stats.duration")} value={polyline.currentLegDurationMinutes !== null ? formatDurationHM(polyline.currentLegDurationMinutes) : "--"} />
              <Stat label={t("live.stats.distance")} value={polyline.currentLegDistanceKm !== null ? formatDistanceKm(polyline.currentLegDistanceKm) : "--"} />
            </AppCard>
            <View style={styles.iconRail}>
              {scopeButton()}
              <TripActionDockButton active={openSection === "stop"} icon="map-marker-check-outline" label={t("live.actionCategories.currentStop", { name: current.title })} onPress={() => toggleSection("stop")} />
              {/* The customer list with drag-to-reorder, one tap away — not
                  only from inside the "order" menu. */}
              {pendingCount > 1 ? (
                <TripActionDockButton
                  active={reorderSheetVisible}
                  icon="format-list-numbered"
                  label={t("reorderSheet.open", { count: pendingCount })}
                  onPress={() => {
                    setOpenSection(null);
                    setReorderSheetVisible(true);
                  }}
                />
              ) : null}
              {pendingCount > 1 ? (
                <TripActionDockButton active={openSection === "order"} badge={pendingCount} icon="sort-variant" label={t("live.actionCategories.routeOrder")} onPress={() => toggleSection("order")} />
              ) : null}
              {hasSettings ? (
                <TripActionDockButton active={openSection === "settings"} icon="tune-variant" label={t("live.actionCategories.settings")} onPress={() => toggleSection("settings")} />
              ) : null}
            </View>
          </View>
        )}
      </View>

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
  statsDock: { flex: 1 },
  statsCard: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
  statColumn: { alignItems: "center", flex: 1, gap: 2 },
  iconRail: { gap: spacing.xs },
  doneCard: { gap: spacing.xxs, padding: spacing.md },
  lastStopRow: { gap: spacing.xs },
});

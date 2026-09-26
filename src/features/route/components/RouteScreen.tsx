import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppErrorBoundary } from "@/src/components/layout/AppErrorBoundary";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { routeT } from "@/src/features/route/i18n/routeT";
import { RouteMoveStopDialog } from "@/src/features/route/components/RouteMoveStopDialog";
import { RouteSelectionActionsBar } from "@/src/features/route/components/RouteSelectionActionsBar";
import { RouteSelectionBar } from "@/src/features/route/components/RouteSelectionBar";
import { RouteSortModePicker } from "@/src/features/route/components/RouteSortModePicker";
import { RouteStartCard } from "@/src/features/route/components/RouteStartCard";
import { RouteStopRow } from "@/src/features/route/components/RouteStopRow";
import { RouteSummaryHeader } from "@/src/features/route/components/RouteSummaryHeader";
import { useRouteOrderItems } from "@/src/features/route/hooks/useRouteOrderItems";
import { useRouteOrder } from "@/src/features/route/hooks/useRouteOrder";
import { useRouteOrigin } from "@/src/features/route/hooks/useRouteOrigin";
import { useRouteSelection } from "@/src/features/route/hooks/useRouteSelection";
import { useRouteSelectionActions } from "@/src/features/route/hooks/useRouteSelectionActions";
import { useRouteStops } from "@/src/features/route/hooks/useRouteStops";
import { moveIdToPosition } from "@/src/features/route/services/routeManualOrderService";
import { RouteSortMode } from "@/src/features/route/services/routeSortModeService";
import { formatEtaTime, parseTimeInput } from "@/src/features/route/utils/routeFormat";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { navigationService } from "@/src/services/navigationService";
import { spacing } from "@/src/theme/spacing";

const DEPARTURE_TIME_STEP_MINUTES = 15;

function roundedNow() {
  const now = new Date();
  now.setMinutes(Math.floor(now.getMinutes() / DEPARTURE_TIME_STEP_MINUTES) * DEPARTURE_TIME_STEP_MINUTES, 0, 0);
  return now;
}

type RouteScreenProps = {
  selectedIds: string[];
};

export function RouteScreen(props: RouteScreenProps) {
  const t = routeT;
  const router = useRouter();
  const colors = useThemeColors();
  const origin = useRouteOrigin();
  const [departureDate, setDepartureDate] = useState(roundedNow);
  const [completeConfirmVisible, setCompleteConfirmVisible] = useState(false);
  // The user's own saved list (driver, admin and super_admin alike) — set
  // as soon as they move a stop by hand, or when their manager sorted it
  // for them from the driver view. While it covers any stop on this route,
  // the route keeps exactly that order (no automatic optimization) until
  // "Automatisch sortieren" clears it. Updates live from the other side.
  // Picked before the trip starts (point 6: don't jump straight into the
  // trip after drawing) — see routeSortModeService for what each does.
  const [sortMode, setSortMode] = useState<RouteSortMode>("optimized");
  // Stops taken out of this route here ("Aus Route entfernen") — the map
  // selection itself is left alone, "Auswahl ändern" goes back to it.
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const routeIds = useMemo(() => {
    const removed = new Set(removedIds);
    return props.selectedIds.filter((id) => !removed.has(id));
  }, [props.selectedIds, removedIds]);
  const currentUserId = useCurrentUser()?.uid ?? null;
  const routeOrder = useRouteOrder(currentUserId);
  const manualOrderIds = useMemo(() => {
    const selected = new Set(routeIds);
    return routeOrder.savedIds?.some((id) => selected.has(id)) ? routeOrder.savedIds : null;
  }, [routeOrder.savedIds, routeIds]);
  const [moveStopId, setMoveStopId] = useState<string | null>(null);

  const { stops, status, error, customersLoading, reload } = useRouteStops(
    routeIds,
    origin.origin,
    departureDate,
    sortMode,
    manualOrderIds,
  );
  const { ordersByCustomerId } = useRouteOrderItems(routeIds);
  const selection = useRouteSelection(stops);
  const selectedStops = useMemo(
    () => stops.filter((stop) => selection.isSelected(stop.marker.id)),
    [stops, selection],
  );
  const selectionActions = useRouteSelectionActions({ selectedStops, reload });

  const moveStopIndex = moveStopId ? stops.findIndex((stop) => stop.marker.id === moveStopId) : -1;
  const moveStopTarget =
    moveStopIndex === -1 ? null : { name: stops[moveStopIndex].marker.title, position: moveStopIndex + 1 };

  function moveStop(customerId: string, position: number) {
    const currentIds = stops.map((stop) => stop.marker.id);
    const nextIds = moveIdToPosition(currentIds, customerId, position);
    if (nextIds !== currentIds) void routeOrder.save(nextIds);
  }

  // Picking a preset replaces a hand-made order (it's cleared from the
  // saved list too, otherwise it would keep winning).
  function changeSortMode(mode: RouteSortMode) {
    if (manualOrderIds) void routeOrder.clear();
    setSortMode(mode);
  }

  function removeSelectedFromRoute() {
    setRemovedIds((current) => [...new Set([...current, ...selection.selectedIds])]);
    selection.clearSelection();
  }

  const completedCount = Math.max(routeIds.length - stops.length, 0);
  const lastStop = stops.length ? stops[stops.length - 1] : null;

  function handleDepartureTimeChange(value: string) {
    const parsed = parseTimeInput(value, departureDate);
    if (parsed) {
      setDepartureDate(parsed);
    }
  }

  async function handleStartTrip() {
    // If the user typed an address but never pressed "Suchen", resolve it
    // now — otherwise the trip would silently start from the old/GPS origin.
    const effectiveOrigin = await origin.ensureOriginMatchesLabel();

    router.push({
      pathname: "/map/route/live",
      params: {
        ids: stops.map((stop) => stop.marker.id).join(","),
        departureTime: departureDate.toISOString(),
        ...(effectiveOrigin
          ? { originLat: String(effectiveOrigin.latitude), originLng: String(effectiveOrigin.longitude) }
          : {}),
      },
    });
  }

  if (customersLoading && !stops.length) {
    return <LoadingView label={t("screen.loading")} />;
  }

  return (
    <AppErrorBoundary>
    <ScreenContainer contentStyle={styles.screenContent}>
      <FlatList
        contentContainerStyle={styles.content}
        data={stops}
        keyExtractor={(item) => item.marker.id}
        ListEmptyComponent={
          !error && status !== "loading" ? <EmptyState message={t("empty.message")} title={t("empty.title")} /> : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <AnimatedEntrance>
              <RouteSummaryHeader completedCount={completedCount} lastStop={lastStop} totalCount={routeIds.length} />
            </AnimatedEntrance>
            <AnimatedEntrance delay={50}>
              <RouteStartCard
                departureTimeText={formatEtaTime(departureDate)}
                geocodeError={origin.geocodeError}
                geocoding={origin.geocoding}
                locationLabel={origin.labelDraft}
                locationLoading={origin.locationLoading}
                onDepartureTimeChange={handleDepartureTimeChange}
                onLocationLabelChange={origin.setLabelDraft}
                onSearchLocation={() => void origin.searchLocation(origin.labelDraft)}
                onUseCurrentLocation={() => void origin.useCurrentLocation()}
              />
            </AnimatedEntrance>
            {stops.length > 1 ? (
              <AnimatedEntrance delay={70}>
                <RouteSortModePicker isManual={manualOrderIds !== null} onChange={changeSortMode} value={sortMode} />
              </AnimatedEntrance>
            ) : null}
            <AnimatedEntrance delay={90}>
              <RouteSelectionBar
                actionSlot={
                  selection.selectedCount > 0 ? (
                    <RouteSelectionActionsBar
                      actionError={selectionActions.actionError}
                      completingAll={selectionActions.completingAll}
                      onCompleteAll={() => setCompleteConfirmVisible(true)}
                      onRemoveFromRoute={removeSelectedFromRoute}
                      onShare={() => void selectionActions.share()}
                      selectedCount={selection.selectedCount}
                      sharing={selectionActions.sharing}
                    />
                  ) : null
                }
                allSelected={selection.allSelected}
                onToggleSelectAll={selection.toggleSelectAll}
                selectedCount={selection.selectedCount}
                totalCount={stops.length}
              />
            </AnimatedEntrance>
            {error ? (
              <AnimatedEntrance delay={120}>
                <ErrorState message={error} />
              </AnimatedEntrance>
            ) : null}
            {routeOrder.error ? <ErrorState message={routeOrder.error} /> : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedEntrance>
            <RouteStopRow
              onMoveDown={index < stops.length - 1 ? () => moveStop(item.marker.id, index + 2) : undefined}
              onMoveUp={index > 0 ? () => moveStop(item.marker.id, index) : undefined}
              onPressPosition={() => setMoveStopId(item.marker.id)}
              onNavigate={() =>
                void navigationService.openDefaultNavigation({
                  latitude: item.marker.latitude,
                  longitude: item.marker.longitude,
                  address: item.marker.description,
                })
              }
              onToggleSelection={() => selection.toggleSelection(item.marker.id)}
              orders={ordersByCustomerId.get(item.marker.id) ?? []}
              selected={selection.isSelected(item.marker.id)}
              stop={item}
            />
          </AnimatedEntrance>
        )}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
      <RouteMoveStopDialog
        key={moveStopId ?? "closed"}
        onCancel={() => setMoveStopId(null)}
        onConfirm={(position) => {
          if (moveStopId) moveStop(moveStopId, position);
          setMoveStopId(null);
        }}
        stop={moveStopTarget}
        totalCount={stops.length}
      />
      <ConfirmDialog
        destructive
        message={t("selectionActions.completeSelectedMessage")}
        onCancel={() => setCompleteConfirmVisible(false)}
        onConfirm={() => {
          setCompleteConfirmVisible(false);
          void selectionActions.completeAllOpenOrders().then((success) => {
            if (success) {
              selection.clearSelection();
            }
          });
        }}
        title={t("selectionActions.completeSelectedTitle", { count: selection.selectedCount })}
        visible={completeConfirmVisible}
      />
      <ConfirmDialog
        cancelLabel={t("selectionActions.shareStepCancel")}
        confirmLabel={t("selectionActions.shareStepConfirm")}
        message={
          selectionActions.shareQueue
            ? t("selectionActions.shareStepMessage", { name: selectionActions.shareQueue[selectionActions.shareIndex].name })
            : ""
        }
        onCancel={selectionActions.cancelShareQueue}
        onConfirm={() => void selectionActions.confirmShareCurrent()}
        title={
          selectionActions.shareQueue
            ? t("selectionActions.shareStepTitle", {
                index: selectionActions.shareIndex + 1,
                count: selectionActions.shareQueue.length,
              })
            : ""
        }
        visible={selectionActions.shareQueue !== null}
      />
      {/* Last step, on purpose: after drawing, the driver first lands on
          this list to check the selection and pick a sorting — the trip
          only starts from here, never straight from the map. */}
      <SafeAreaView edges={["bottom"]} style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.footerButton}>
          <AppButton label={t("sortMode.changeSelection")} onPress={() => router.back()} variant="secondary" />
        </View>
        {stops.length > 0 ? (
          <View style={styles.footerButton}>
            <AppButton label={t("startCard.startButton")} loading={origin.geocoding} onPress={() => void handleStartTrip()} />
          </View>
        ) : null}
      </SafeAreaView>
    </ScreenContainer>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { gap: spacing.sm, paddingBottom: spacing.xl },
  screenContent: { paddingTop: 0 },
  header: { gap: spacing.sm, marginBottom: spacing.xs },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderTopWidth: 1,
  },
  footerButton: { flex: 1 },
});

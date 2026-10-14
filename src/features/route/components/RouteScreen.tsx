import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import ReorderableList from "react-native-reorderable-list";
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
import { AppText } from "@/src/components/ui/AppText";
import { RouteLastStopDropdown } from "@/src/features/route/components/RouteLastStopDropdown";
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
  const [sortMode, setSortMode] = useState<RouteSortMode>("nearest");
  // Stops taken out of this route here ("Aus Route entfernen") — the map
  // selection itself is left alone, "Auswahl ändern" goes back to it.
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const routeIds = useMemo(() => {
    const removed = new Set(removedIds);
    return props.selectedIds.filter((id) => !removed.has(id));
  }, [props.selectedIds, removedIds]);
  const currentUserId = useCurrentUser()?.uid ?? null;
  const routeOrder = useRouteOrder(currentUserId);
  // A saved hand-made order only counts when it covers every stop of this
  // route (moving a stop saves the whole route, so a route sorted by hand
  // always does). One that only knows some of them is left over from other
  // days' routes: applying it kept those stops in their old order and
  // appended the rest, which sent the trip back and forth across the map.
  const manualOrderIds = useMemo(() => {
    const saved = routeOrder.savedIds ? new Set(routeOrder.savedIds) : null;
    return saved && routeIds.length && routeIds.every((id) => saved.has(id)) ? routeOrder.savedIds : null;
  }, [routeOrder.savedIds, routeIds]);
  const [moveStopId, setMoveStopId] = useState<string | null>(null);
  const [lastStopId, setLastStopId] = useState<string | null>(null);
  // "Another route" — bumped on every tap of that chip.
  const [variantIndex, setVariantIndex] = useState(0);

  const { stops, status, error, customersLoading, reload } = useRouteStops(
    routeIds,
    origin.origin,
    departureDate,
    sortMode,
    manualOrderIds,
    lastStopId,
    variantIndex,
  );
  // "N. Name" in the current stop order, matching the numbers in the list.
  const lastStopOptions = useMemo(
    () => stops.map((stop, index) => ({ id: stop.marker.id, name: `${index + 1}. ${stop.marker.title}` })),
    [stops],
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

  // First tap switches to the alternative routes, every further tap shows
  // the next one.
  function showAnotherRoute() {
    if (sortMode === "alternative" && !manualOrderIds) {
      setVariantIndex((current) => current + 1);
      return;
    }
    changeSortMode("alternative");
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
      <ReorderableList
        contentContainerStyle={styles.content}
        data={stops}
        keyExtractor={(item) => item.marker.id}
        onReorder={({ from, to }) => {
          const moved = stops[from];
          if (moved && from !== to) moveStop(moved.marker.id, to + 1);
        }}
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
                <RouteSortModePicker
                  isManual={manualOrderIds !== null}
                  onAnotherRoute={showAnotherRoute}
                  onChange={changeSortMode}
                  value={sortMode}
                  variantNumber={variantIndex + 1}
                />
              </AnimatedEntrance>
            ) : null}
            {stops.length > 1 ? (
              <AnimatedEntrance delay={80}>
                <View style={styles.lastStopRow}>
                  <AppText color="muted" variant="label">
                    {t("startCard.lastStopLabel")}
                  </AppText>
                  <RouteLastStopDropdown onChange={setLastStopId} options={lastStopOptions} value={lastStopId} />
                </View>
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
        renderItem={({ item }) => (
          <AnimatedEntrance style={styles.item}>
            <RouteStopRow
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
  // No `gap` here: the drag list measures its cells, so spacing lives in them.
  content: { paddingBottom: spacing.xl },
  item: { paddingBottom: spacing.sm },
  screenContent: { paddingTop: 0 },
  header: { gap: spacing.sm, marginBottom: spacing.md },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderTopWidth: 1,
  },
  footerButton: { flex: 1 },
  lastStopRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});

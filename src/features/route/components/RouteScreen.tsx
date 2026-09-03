import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppErrorBoundary } from "@/src/components/layout/AppErrorBoundary";
import { AppText } from "@/src/components/ui/AppText";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { routeT } from "@/src/features/route/i18n/routeT";
import { RouteLastStopDropdown } from "@/src/features/route/components/RouteLastStopDropdown";
import { RouteSelectionActionsBar } from "@/src/features/route/components/RouteSelectionActionsBar";
import { RouteSelectionBar } from "@/src/features/route/components/RouteSelectionBar";
import { RouteStartCard } from "@/src/features/route/components/RouteStartCard";
import { RouteStopRow } from "@/src/features/route/components/RouteStopRow";
import { RouteSummaryHeader } from "@/src/features/route/components/RouteSummaryHeader";
import { useRouteOrderItems } from "@/src/features/route/hooks/useRouteOrderItems";
import { useRouteOrigin } from "@/src/features/route/hooks/useRouteOrigin";
import { useRouteSelection } from "@/src/features/route/hooks/useRouteSelection";
import { useRouteSelectionActions } from "@/src/features/route/hooks/useRouteSelectionActions";
import { useRouteStops } from "@/src/features/route/hooks/useRouteStops";
import { formatEtaTime, parseTimeInput } from "@/src/features/route/utils/routeFormat";
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
  const origin = useRouteOrigin();
  const [departureDate, setDepartureDate] = useState(roundedNow);
  const [completeConfirmVisible, setCompleteConfirmVisible] = useState(false);
  // Overrides the automatic (nearest-neighbor / Directions-optimized)
  // ordering for exactly one stop: whoever is picked here is always last.
  const [lastStopId, setLastStopId] = useState<string | null>(null);

  const { stops, status, error, customersLoading, reload } = useRouteStops(props.selectedIds, origin.origin, departureDate, lastStopId);
  const { ordersByCustomerId } = useRouteOrderItems(props.selectedIds);
  const selection = useRouteSelection(stops);
  const selectedStops = useMemo(
    () => stops.filter((stop) => selection.isSelected(stop.marker.id)),
    [stops, selection],
  );
  const selectionActions = useRouteSelectionActions({ selectedStops, reload });
  // Labeled "N. Name" and sorted by that same stop number — matches the
  // numbered pins/order badges shown everywhere else on this screen, so the
  // dropdown lines up with what the driver already sees, not an unrelated
  // alphabetical list.
  const lastStopOptions = useMemo(
    () =>
      [...stops]
        .sort((left, right) => left.orderIndex - right.orderIndex)
        .map((stop) => ({ id: stop.marker.id, name: `${stop.orderIndex + 1}. ${stop.marker.title}` })),
    [stops],
  );

  const completedCount = Math.max(props.selectedIds.length - stops.length, 0);
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
              <RouteSummaryHeader completedCount={completedCount} lastStop={lastStop} totalCount={props.selectedIds.length} />
            </AnimatedEntrance>
            {stops.length > 0 ? (
              <AnimatedEntrance delay={30}>
                <AppButton
                  label={t("startCard.startButton")}
                  loading={origin.geocoding}
                  onPress={() => void handleStartTrip()}
                />
              </AnimatedEntrance>
            ) : null}
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
          </View>
        }
        renderItem={({ item }) => (
          <AnimatedEntrance>
            <RouteStopRow
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
    </ScreenContainer>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { gap: spacing.sm, paddingBottom: spacing.xl },
  screenContent: { paddingTop: 0 },
  header: { gap: spacing.sm, marginBottom: spacing.xs },
  lastStopRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});

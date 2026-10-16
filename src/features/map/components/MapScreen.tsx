import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { AppState, AppStateStatus, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { mapT } from "@/src/features/map/i18n/mapT";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppErrorBoundary } from "@/src/components/layout/AppErrorBoundary";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { spacing } from "@/src/constants/spacing";
import { AddressCheckSheet } from "@/src/features/map/components/AddressCheckSheet";
import { AppMapView } from "@/src/features/map/components/AppMapView";
import { CustomerMarker } from "@/src/features/map/components/CustomerMarker";
import { DriverAssignSheet } from "@/src/features/map/components/DriverAssignSheet";
import { DriverLiveStatusSheet } from "@/src/features/map/components/DriverLiveStatusSheet";
import { MapCustomerSheet } from "@/src/features/map/components/MapCustomerSheet";
import { MapCategoryBar, type MapCategory } from "@/src/features/map/components/MapCategoryBar";
import { MapFilters } from "@/src/features/map/components/MapFilters";
import { MapSelectionToolbar } from "@/src/features/map/components/MapSelectionToolbar";
import { MapToolbar } from "@/src/features/map/components/MapToolbar";
import { PolygonDrawOverlay } from "@/src/features/map/components/PolygonDrawOverlay";
import { PolygonSelectionOverlay } from "@/src/features/map/components/PolygonSelectionOverlay";
import { SelectedCustomersBar } from "@/src/features/map/components/SelectedCustomersBar";
import { SelectedCustomersList } from "@/src/features/map/components/SelectedCustomersList";
import { canManageDrivers, isDriver } from "@/src/features/auth/permissions";
import { useDriverAssignment } from "@/src/features/map/hooks/useDriverAssignment";
import { useDriverLiveStatus } from "@/src/features/map/hooks/useDriverLiveStatus";
import { useMapActions } from "@/src/features/map/hooks/useMapActions";
import { useMapCustomerDetails } from "@/src/features/map/hooks/useMapCustomerDetails";
import { useMapCustomers } from "@/src/features/map/hooks/useMapCustomers";
import { useMapCustomerSelection } from "@/src/features/map/hooks/useMapCustomerSelection";
import { useMapFilters } from "@/src/features/map/hooks/useMapFilters";
import { mapClusteringService } from "@/src/features/map/services/mapClusteringService";
import { useUserLocation } from "@/src/features/map/hooks/useUserLocation";
import { MapTripPanel } from "@/src/features/route/components/MapTripPanel";
import { RoutePolyline } from "@/src/features/route/components/RoutePolyline";
import { RouteStopMarker } from "@/src/features/route/components/RouteStopMarker";
import { useMapTrip } from "@/src/features/route/hooks/useMapTrip";
import { routeT } from "@/src/features/route/i18n/routeT";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { AppMapViewHandle } from "@/src/features/map/types/mapViewTypes";
import { orderRepository } from "@/src/repositories/orderRepository";
import { formatError } from "@/src/utils/formatError";

const TAB_BAR_CLEARANCE = 68 + 14 + spacing.sm;

const MAP_REFOCUS_MAX_AGE_MS = 60_000;

export function MapScreen() {
  const { t: actionT } = useTranslation("map");
  const mapRef = useRef<AppMapViewHandle | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastAutoFitFilterRef = useRef<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = mapT;
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [completeConfirmVisible, setCompleteConfirmVisible] = useState(false);
  const [deleteSelectedConfirmVisible, setDeleteSelectedConfirmVisible] = useState(false);
  const [deleteSelectedConfirmStep, setDeleteSelectedConfirmStep] = useState(1);
  const [addressCheckVisible, setAddressCheckVisible] = useState(false);
  const [assignmentCustomerIds, setAssignmentCustomerIds] = useState<string[] | null>(null);
  const [activeCategory, setActiveCategory] = useState<MapCategory | null>(null);
  const { error, hasPermission, isLoading, region, reload } = useUserLocation();
  const {
    error: customersError,
    isLoading: customersLoading,
    markers,
    needsAddressCheck,
    openOrdersCount,
    customersCount,
    newAssignmentMessage,
    reload: reloadCustomers,
    refreshIfStale,
  } = useMapCustomers();
  const { filters, filteredMarkers, countryOptions, cityOptions, resetFilters, selectCity, selectCountry } = useMapFilters(markers);
  const [visibleRegion, setVisibleRegion] = useState(region);
  const [prevRegion, setPrevRegion] = useState(region);
  const { details, error: detailsError, isLoading: detailsLoading, reload: reloadDetails } = useMapCustomerDetails(selectedCustomerId);
  const currentUser = useCurrentUser();
  const canAssignDrivers = canManageDrivers(currentUser);
  const driverAssignment = useDriverAssignment();
  const driverLiveStatus = useDriverLiveStatus();
  const isCurrentUserDriver = isDriver(currentUser);
  const selectedMarker = useMemo(() => filteredMarkers.find((value) => value.id === selectedCustomerId) ?? null, [filteredMarkers, selectedCustomerId]);
  const mapActions = useMapActions(details, selectedMarker);
  const productEmojiById = useMemo(() => new Map(mapActions.products.map((product) => [product.id, product.emoji])), [mapActions.products]);
  // Only a real GPS fix should feed the "approximate arrival time" WhatsApp
  // component -- the fallback region (map center with no permission) would
  // otherwise produce a plausible-looking but meaningless estimate.
  const customerSelection = useMapCustomerSelection(markers, filteredMarkers, productEmojiById, hasPermission ? region : null);
  const selectedIdSet = useMemo(() => new Set(customerSelection.selection.selectedIds), [customerSelection.selection.selectedIds]);
  const drawingSelection = customerSelection.selection.activeTool === "polygon";
  const drawingPaused = customerSelection.selection.polygonPaused;
  const mapGesturesEnabled = !drawingSelection || drawingPaused;
  const filterKey = `${filters.country}\u0000${filters.city}`;
  // The trip is always running (like IBI): every customer on the map — the
  // country/city filter decides which — is a numbered stop. Drawing only
  // selects customers for the selection actions, it doesn't change the route.
  const trip = useMapTrip(filteredMarkers, !customersLoading, hasPermission ? region : null);
  const tripNavigation = trip.navigation;
  const isSelectedCurrentStop = selectedCustomerId !== null && selectedCustomerId === tripNavigation.currentMarker?.id;
  const isSelectedPendingFutureStop =
    selectedCustomerId !== null &&
    !isSelectedCurrentStop &&
    tripNavigation.pendingMarkers.some((marker) => marker.id === selectedCustomerId);
  const canReactivateSelected = selectedCustomerId !== null && tripNavigation.handledIds.has(selectedCustomerId);
  const [skipConfirmVisible, setSkipConfirmVisible] = useState(false);
  const selectedCount = customerSelection.selection.selectedIds.length;
  const pendingTripCount = tripNavigation.pendingMarkers.length;
  // Customers on the map that aren't on the route right now (the trip was
  // started for a drawn selection): plain pins, no number.
  const offRouteMarkers = useMemo(() => {
    if (!trip.ready) return [];
    const onRoute = new Set(trip.orderedMarkers.map((marker) => marker.id));
    return filteredMarkers.filter((marker) => !onRoute.has(marker.id));
  }, [trip.ready, trip.orderedMarkers, filteredMarkers]);

  function startTripForSelection() {
    trip.startForSelection(customerSelection.selection.selectedIds);
    customerSelection.resetSelection();
    setActiveCategory("trip");
  }

  function handleStopPress(marker: (typeof filteredMarkers)[number]) {
    if (customerSelection.selection.activeTool === "single") return customerSelection.selection.handleMarkerPress(marker);
    if (customerSelection.selection.activeTool !== "none") return;
    setSelectedCustomerId(marker.id);
  }
  const clusterItems = useMemo(
    () => mapClusteringService.buildClusterItems({ markers: filteredMarkers, region: visibleRegion }),
    [filteredMarkers, visibleRegion],
  );

  // Re-syncs the tracked viewport whenever the underlying location region
  // changes (e.g. once GPS resolves) — adjusted directly during render
  // (React's documented pattern for "reset state when a prop changes")
  // rather than in an effect. Panning/zooming updates visibleRegion
  // separately via onRegionChangeComplete below.
  if (region !== prevRegion) {
    setPrevRegion(region);
    setVisibleRegion(region);
  }

  const hasFocusedOnceRef = useRef(false);

  useFocusEffect(useCallback(() => {
    // useMapCustomers() already loads once on mount — reloading again on this
    // very first focus fired a second, redundant load in parallel. Later
    // refocuses only reload when the data is older than a minute: the live
    // subscription keeps it current in between, so a full reload on every
    // return to the map was pure extra traffic.
    if (hasFocusedOnceRef.current) {
      void refreshIfStale(MAP_REFOCUS_MAX_AGE_MS);
    } else {
      hasFocusedOnceRef.current = true;
    }
    if (selectedCustomerId) void reloadDetails();
  }, [refreshIfStale, reloadDetails, selectedCustomerId]));

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const wasBackgrounded = appStateRef.current === "background" || appStateRef.current === "inactive";
      appStateRef.current = nextState;

      // External navigation apps can keep this screen mounted for hours.
      // Re-read server state on return so assignments, completions and newly
      // created orders are never represented by an old in-memory snapshot.
      if (wasBackgrounded && nextState === "active") {
        void reload();
        void reloadCustomers();
        if (selectedCustomerId) void reloadDetails();
      }
    });

    return () => subscription.remove();
  }, [reload, reloadCustomers, reloadDetails, selectedCustomerId]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedCustomerId) return;
    if (filteredMarkers.length === 0) return;
    if (lastAutoFitFilterRef.current === filterKey) return;

    lastAutoFitFilterRef.current = filterKey;
    if (filteredMarkers.length === 1) {
      const marker = filteredMarkers[0];
      mapRef.current.animateToRegion({ latitude: marker.latitude, longitude: marker.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      return;
    }
    if (filteredMarkers.length > 1) {
      mapRef.current.fitToCoordinates(filteredMarkers.map((value) => ({ latitude: value.latitude, longitude: value.longitude })), {
        animated: true,
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
      });
    }
  }, [filterKey, filteredMarkers, selectedCustomerId]);

  async function handleConfirmComplete() {
    setCompleteConfirmVisible(false);
    // The stop being driven to right now goes through the trip, so the
    // remaining route continues from this customer.
    const completed = isSelectedCurrentStop ? await tripNavigation.confirmArrival() : await mapActions.completeOpenOrder();
    if (!completed) return;
    setSelectedCustomerId(null);
    await reloadCustomers();
  }

  async function handleConfirmDeleteSelected() {
    if (deleteSelectedConfirmStep < 3) {
      setDeleteSelectedConfirmStep((current) => current + 1);
      return;
    }

    setDeleteSelectedConfirmVisible(false);
    setDeleteSelectedConfirmStep(1);
    const deleted = await customerSelection.deleteSelectedCustomers();
    if (!deleted) return;
    await reloadCustomers();
  }

  function handleCancelDeleteSelected() {
    setDeleteSelectedConfirmVisible(false);
    setDeleteSelectedConfirmStep(1);
  }

  const deleteSelectedConfirmMessages = {
    1: actionT("selectedBar.deleteConfirmMessage", { count: customerSelection.selectedMarkers.length }),
    2: `Bitte nochmal bestaetigen: Diese ${customerSelection.selectedMarkers.length} Kunden und alle Bestellungen verschwinden dauerhaft.`,
    3: `Letzte Warnung: Wenn du jetzt bestaetigst, wird wirklich alles fuer diese ${customerSelection.selectedMarkers.length} Kunden geloescht.`,
  };

  async function handleSelectDriver(driverId: string | null) {
    const customerIds = assignmentCustomerIds ?? (selectedCustomerId ? [selectedCustomerId] : []);
    const assigned = await driverAssignment.assignMany(customerIds, driverId);
    if (!assigned) return;

    setAssignmentCustomerIds(null);
    await Promise.all([reloadCustomers(), selectedCustomerId ? reloadDetails() : Promise.resolve()]);
  }

  const [changingDriverVisibility, setChangingDriverVisibility] = useState(false);
  const [driverVisibilityMessage, setDriverVisibilityMessage] = useState<string | null>(null);
  const [driverVisibilityError, setDriverVisibilityError] = useState<string | null>(null);

  // Hide/show the selected customers from whichever driver they're
  // assigned to — live on the driver's map/route, nothing is deleted.
  async function setSelectionHiddenForDriver(hidden: boolean) {
    const customerIds = customerSelection.selectedMarkers.map((marker) => marker.id);
    setChangingDriverVisibility(true);
    setDriverVisibilityMessage(null);
    setDriverVisibilityError(null);
    try {
      const changed = await orderRepository.setHiddenFromDriver(null, customerIds, hidden);
      if (changed === 0) {
        setDriverVisibilityError(actionT("selectedBar.noAssignedOrders"));
      } else {
        setDriverVisibilityMessage(actionT(hidden ? "selectedBar.hiddenDone" : "selectedBar.shownDone", { count: changed }));
        await reloadCustomers();
      }
    } catch (visibilityError) {
      setDriverVisibilityError(formatError(visibilityError).message);
    } finally {
      setChangingDriverVisibility(false);
    }
  }

  function openDriverAssignment(customerIds: string[]) {
    if (!customerIds.length) return;
    setAssignmentCustomerIds([...new Set(customerIds)]);
    void driverAssignment.open();
  }

  if (isLoading) return <LoadingView label={t("screen.loading")} />;

  return (
    <AppErrorBoundary>
      <View style={styles.screen}>
      <AppMapView
        initialRegion={region}
        onRegionChangeComplete={setVisibleRegion}
        onPanDrag={(event) => {
          if (customerSelection.selection.activeTool === "polygon") {
            customerSelection.selection.handleMapDrag(event.nativeEvent.coordinate);
          }
        }}
        ref={mapRef}
        pitchEnabled={mapGesturesEnabled}
        rotateEnabled={mapGesturesEnabled}
        scrollEnabled={mapGesturesEnabled}
        showsCompass
        showsUserLocation={hasPermission}
        style={StyleSheet.absoluteFill}
        userLocationCoordinate={hasPermission ? region : null}
        zoomEnabled={mapGesturesEnabled}
      >
        {trip.ready ? (
          <>
            {trip.lineCoordinates.length >= 2 ? <RoutePolyline coordinates={trip.lineCoordinates} /> : null}
            {trip.orderedMarkers.map((marker, index) => (
              <RouteStopMarker
                active={marker.id === tripNavigation.currentMarker?.id}
                inactive={tripNavigation.handledIds.has(marker.id)}
                key={marker.id}
                label={String(index + 1)}
                marker={marker}
                onPress={() => handleStopPress(marker)}
                selected={selectedIdSet.has(marker.id)}
                skipped={tripNavigation.skippedIds.has(marker.id)}
              />
            ))}
            {offRouteMarkers.map((marker) => (
              <CustomerMarker
                key={marker.id}
                marker={marker}
                onPress={() => handleStopPress(marker)}
                selected={selectedIdSet.has(marker.id)}
              />
            ))}
          </>
        ) : (
          clusterItems.map((item) =>
            item.type === "cluster" ? null : (
              <CustomerMarker
                key={item.id}
                marker={item.marker}
                onPress={() => handleStopPress(item.marker)}
                selected={selectedIdSet.has(item.marker.id)}
              />
            ),
          )
        )}
        <PolygonSelectionOverlay confirmedPolygon={customerSelection.selection.polygonConfirmed} draftPoints={customerSelection.selection.polygonPoints} />
      </AppMapView>

      <SafeAreaView edges={["top"]} pointerEvents="box-none" style={styles.topOverlay}>
        <View style={styles.topOverlayContent}>
          <AnimatedEntrance>
            <MapCategoryBar
              activeCategory={activeCategory}
              filterActive={Boolean(filters.country || filters.city)}
              onChange={setActiveCategory}
              selectedCount={selectedCount}
              tripCount={pendingTripCount}
              warningCount={needsAddressCheck.length + (error || customersError ? 1 : 0)}
            />
          </AnimatedEntrance>
          {activeCategory === "overview" ? (
            <AnimatedEntrance delay={40}>
              <View style={styles.categoryContent}>
                <MapToolbar
                  customersCount={customersCount}
                  customersError={customersError}
                  customersLoading={customersLoading}
                  filteredCount={filteredMarkers.length}
                  locationError={error}
                  locationPermissionDenied={!hasPermission}
                  needsAddressCheckCount={needsAddressCheck.length}
                  onOpenAddressCheck={() => setAddressCheckVisible(true)}
                  onRetryCustomers={() => void reloadCustomers()}
                  onRetryLocation={() => void reload()}
                  openOrdersCount={openOrdersCount}
                />
                {isCurrentUserDriver ? (
                  <AppButton label={t("driverStatus.open")} onPress={driverLiveStatus.open} size="compact" variant="secondary" />
                ) : null}
                {newAssignmentMessage ? <SuccessState message={newAssignmentMessage} /> : null}
              </View>
            </AnimatedEntrance>
          ) : null}
          {activeCategory === "filters" ? (
            <AnimatedEntrance delay={40}>
              <View style={styles.categoryContent}>
                <MapFilters
                  cityOptions={cityOptions}
                  countryOptions={countryOptions}
                  filters={filters}
                  onCityChange={selectCity}
                  onCountryChange={selectCountry}
                  onReset={resetFilters}
                />
              </View>
            </AnimatedEntrance>
          ) : null}
          {activeCategory === "selection" || drawingSelection ? (
          <AnimatedEntrance delay={40}>
            <View style={styles.categoryContent}>
            <MapSelectionToolbar
              activeTool={customerSelection.selection.activeTool}
              onResetSelection={customerSelection.resetSelection}
              onSelectTool={customerSelection.selection.selectTool}
            />
            {!drawingSelection ? (
              <SelectedCustomersBar
                deleteError={customerSelection.deleteError}
                deleting={customerSelection.deleting}
                emailing={customerSelection.emailing}
                inline
                assigningDriver={driverAssignment.assigning}
                changingDriverVisibility={changingDriverVisibility}
                driverVisibilityError={driverVisibilityError}
                driverVisibilityMessage={driverVisibilityMessage}
                hiddenForDriverCount={customerSelection.selectedMarkers.filter((marker) => marker.hiddenFromDriver).length}
                onHideForDriver={canAssignDrivers ? () => void setSelectionHiddenForDriver(true) : undefined}
                onShowForDriver={canAssignDrivers ? () => void setSelectionHiddenForDriver(false) : undefined}
                onAssignDriver={canAssignDrivers
                  ? () => openDriverAssignment(customerSelection.selectedMarkers.map((marker) => marker.id))
                  : undefined}
                onDeleteSelected={() => {
                  setDeleteSelectedConfirmStep(1);
                  setDeleteSelectedConfirmVisible(true);
                }}
                onShare={() => void customerSelection.share()}
                onStartTrip={startTripForSelection}
                onShareByEmail={() => void customerSelection.shareByEmail()}
                onViewSelection={customerSelection.openList}
                loadingSelectionData={customerSelection.totalsLoading}
                previewCustomerCount={customerSelection.exportPreview?.customerCount ?? customerSelection.selectedMarkers.length}
                previewOpenOrderCount={customerSelection.exportPreview?.openOrderCount ?? customerSelection.selectedMarkers.reduce((sum, marker) => sum + marker.openOrderCount, 0)}
                selectedCount={customerSelection.selectedMarkers.length}
                shareError={customerSelection.shareError}
                sharing={customerSelection.sharing}
              />
            ) : null}
            </View>
          </AnimatedEntrance>
          ) : null}
        </View>
      </SafeAreaView>

      <View pointerEvents="box-none" style={[styles.bottomOverlay, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}>
        {/* Also with the selection tools open: after drawing, the trip and its
            list button stay at hand. */}
        {!drawingSelection && (activeCategory === "trip" || activeCategory === "selection") ? (
          <View style={styles.tripPanel}>
            <MapTripPanel trip={trip} />
          </View>
        ) : null}
        <PolygonDrawOverlay
          onClosePolygon={() => {
            customerSelection.selection.closePolygon();
            setActiveCategory("selection");
          }}
          onTogglePause={customerSelection.selection.togglePolygonPause}
          onUndoPolygonPoint={customerSelection.selection.undoPolygonPoint}
          paused={drawingPaused}
          polygonPointCount={customerSelection.selection.polygonPoints.length}
          visible={drawingSelection}
        />
      </View>

      <SelectedCustomersList
        markers={customerSelection.selectedMarkers}
        onClose={customerSelection.closeList}
        onRemove={customerSelection.selection.toggleSelection}
        totals={customerSelection.totals}
        totalsLoading={customerSelection.totalsLoading}
        visible={customerSelection.listVisible}
      />
      <MapCustomerSheet
        actionError={mapActions.actionError}
        actionSuccess={mapActions.actionSuccess}
        details={details}
        error={detailsError}
        loading={detailsLoading}
        onAssignDriver={canAssignDrivers && selectedCustomerId ? () => openDriverAssignment([selectedCustomerId]) : undefined}
        onCall={() => void mapActions.callCustomer()}
        onCallPhone={() => void mapActions.callByPhone()}
        onCallWhatsapp={() => void mapActions.callByWhatsapp()}
        onClose={() => {
          setSelectedCustomerId(null);
          setCompleteConfirmVisible(false);
        }}
        onEdit={() => {
          if (selectedCustomerId) router.push(`/customer/edit/${selectedCustomerId}`);
        }}
        onComplete={() => setCompleteConfirmVisible(true)}
        completing={mapActions.completingOrder}
        onNavigate={() => void mapActions.openNavigationMenu()}
        onRetry={() => void reloadDetails()}
        onShare={() => void mapActions.shareLocation()}
        onShareOrder={() => void mapActions.shareOrder()}
        onReactivate={
          canReactivateSelected && selectedCustomerId
            ? () => {
                tripNavigation.reactivateStop(selectedCustomerId);
                setSelectedCustomerId(null);
              }
            : undefined
        }
        onSkip={isSelectedCurrentStop || isSelectedPendingFutureStop ? () => setSkipConfirmVisible(true) : undefined}
        onSkipLabel={isSelectedPendingFutureStop ? routeT("live.skipToStop") : undefined}
        visible={selectedCustomerId !== null && !completeConfirmVisible && !skipConfirmVisible && !tripNavigation.arrivalPromptVisible}
      />
      <ConfirmDialog
        message={actionT("sheet.skipConfirmMessage")}
        onCancel={() => setSkipConfirmVisible(false)}
        onConfirm={() => {
          setSkipConfirmVisible(false);
          const customerId = selectedCustomerId;
          setSelectedCustomerId(null);
          if (!customerId) return;
          if (customerId === tripNavigation.currentMarker?.id) tripNavigation.skipStop();
          else tripNavigation.skipToMarker(customerId);
        }}
        title={actionT("sheet.skipConfirmTitle")}
        visible={skipConfirmVisible}
      />
      <DriverAssignSheet
        assigning={driverAssignment.assigning}
        currentDriverId={assignmentCustomerIds?.length === 1 ? details?.customer.assignedDriverId : undefined}
        customerCount={assignmentCustomerIds?.length}
        drivers={driverAssignment.drivers}
        error={driverAssignment.error}
        loadingDrivers={driverAssignment.loadingDrivers}
        onClose={() => {
          setAssignmentCustomerIds(null);
          driverAssignment.close();
        }}
        onSelect={(driverId) => void handleSelectDriver(driverId)}
        visible={driverAssignment.visible}
      />
      <DriverLiveStatusSheet
        error={driverLiveStatus.error}
        odometer={driverLiveStatus.odometer}
        onChangeOdometer={driverLiveStatus.setOdometer}
        onClose={driverLiveStatus.close}
        onSend={() => void driverLiveStatus.send()}
        sending={driverLiveStatus.sending}
        success={driverLiveStatus.success}
        visible={driverLiveStatus.visible}
      />
      <AddressCheckSheet
        customers={needsAddressCheck}
        onClose={() => setAddressCheckVisible(false)}
        onEditCustomer={(customerId) => {
          setAddressCheckVisible(false);
          router.push(`/customer/edit/${customerId}`);
        }}
        visible={addressCheckVisible}
      />
      <ConfirmDialog
        destructive
        message={
          (details?.openOrders.length ?? 0) > 1
            ? actionT("sheet.completeAllConfirmMessage", { count: details?.openOrders.length ?? 0 })
            : actionT("sheet.completeConfirmMessage")
        }
        onCancel={() => setCompleteConfirmVisible(false)}
        onConfirm={() => void handleConfirmComplete()}
        title={actionT("sheet.completeConfirmTitle")}
        visible={completeConfirmVisible}
      />
      <ConfirmDialog
        destructive
        confirmLabel={actionT(
          deleteSelectedConfirmStep < 3 ? "selectedBar.deleteConfirmNextLabel" : "selectedBar.deleteConfirmFinalLabel",
          { defaultValue: deleteSelectedConfirmStep < 3 ? "Ja, weiter" : "Endgueltig loeschen" },
        )}
        message={actionT(`selectedBar.deleteConfirmMessage${deleteSelectedConfirmStep}`, {
          count: customerSelection.selectedMarkers.length,
          defaultValue: deleteSelectedConfirmMessages[deleteSelectedConfirmStep as 1 | 2 | 3],
          step: deleteSelectedConfirmStep,
        })}
        onCancel={handleCancelDeleteSelected}
        onConfirm={() => void handleConfirmDeleteSelected()}
        title={actionT("selectedBar.deleteConfirmTitle", {
          defaultValue: "Sicher loeschen? Schritt {{step}} von 3",
          step: deleteSelectedConfirmStep,
        })}
        visible={deleteSelectedConfirmVisible}
      />
      </View>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    direction: "ltr",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  topOverlayContent: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  categoryContent: { gap: spacing.xs, maxHeight: 260 },
  bottomOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  tripPanel: {
    paddingHorizontal: spacing.md,
  },
});

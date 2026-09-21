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
import { ContactMethodSheet } from "@/src/features/map/components/ContactMethodSheet";
import { CustomerMarker } from "@/src/features/map/components/CustomerMarker";
import { DriverAssignSheet } from "@/src/features/map/components/DriverAssignSheet";
import { DriverLiveStatusSheet } from "@/src/features/map/components/DriverLiveStatusSheet";
import { MapCustomerSheet } from "@/src/features/map/components/MapCustomerSheet";
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
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { AppMapViewHandle } from "@/src/features/map/types/mapViewTypes";

const TAB_BAR_CLEARANCE = 68 + 14 + spacing.sm;

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
  const customerSelection = useMapCustomerSelection(markers, filteredMarkers, productEmojiById);
  const selectedIdSet = useMemo(() => new Set(customerSelection.selection.selectedIds), [customerSelection.selection.selectedIds]);
  const drawingSelection = customerSelection.selection.activeTool === "polygon";
  const drawingPaused = customerSelection.selection.polygonPaused;
  const mapGesturesEnabled = !drawingSelection || drawingPaused;
  const filterKey = `${filters.country}\u0000${filters.city}`;
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
    // very first focus fired a second, redundant Firestore load in parallel.
    // Only later refocuses (coming back from another screen) should reload.
    if (hasFocusedOnceRef.current) {
      void reloadCustomers();
    } else {
      hasFocusedOnceRef.current = true;
    }
    if (selectedCustomerId) void reloadDetails();
  }, [reloadCustomers, reloadDetails, selectedCustomerId]));

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
    const completed = await mapActions.completeOpenOrder();
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
        {clusterItems.map((item) => {
          if (item.type === "cluster") {
            return null;
          }

          const marker = item.marker;

          return (
            <CustomerMarker
              key={item.id}
              marker={marker}
              onPress={() => {
                if (customerSelection.selection.activeTool === "single") return customerSelection.selection.handleMarkerPress(marker);
                if (customerSelection.selection.activeTool !== "none") return;
                setSelectedCustomerId(marker.id);
              }}
              selected={selectedIdSet.has(marker.id)}
            />
          );
        })}
        <PolygonSelectionOverlay confirmedPolygon={customerSelection.selection.polygonConfirmed} draftPoints={customerSelection.selection.polygonPoints} />
      </AppMapView>

      <SafeAreaView edges={["top"]} pointerEvents="box-none" style={styles.topOverlay}>
        <View style={styles.topOverlayContent}>
          <AnimatedEntrance>
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
          </AnimatedEntrance>
          {isCurrentUserDriver ? (
            <AppButton label={t("driverStatus.open")} onPress={driverLiveStatus.open} size="compact" variant="secondary" />
          ) : null}
          {newAssignmentMessage ? <SuccessState message={newAssignmentMessage} /> : null}
          <AnimatedEntrance delay={40}>
            <MapSelectionToolbar
              activeTool={customerSelection.selection.activeTool}
              onResetSelection={customerSelection.resetSelection}
              onSelectTool={customerSelection.selection.selectTool}
              rightSlot={
                <View style={styles.inlineControls}>
                  <MapFilters
                    cityOptions={cityOptions}
                    countryOptions={countryOptions}
                    filters={filters}
                    inline
                    onCityChange={selectCity}
                    onCountryChange={selectCountry}
                    onReset={resetFilters}
                  />
                </View>
              }
            />
          </AnimatedEntrance>
          {!drawingSelection ? (
            <AnimatedEntrance delay={80}>
              <SelectedCustomersBar
                deleteError={customerSelection.deleteError}
                deleting={customerSelection.deleting}
                emailing={customerSelection.emailing}
                inline
                assigningDriver={driverAssignment.assigning}
                onAssignDriver={canAssignDrivers
                  ? () => openDriverAssignment(customerSelection.selectedMarkers.map((marker) => marker.id))
                  : undefined}
                onDeleteSelected={() => {
                  setDeleteSelectedConfirmStep(1);
                  setDeleteSelectedConfirmVisible(true);
                }}
                onOpenRoute={() =>
                  router.push({ pathname: "/map/route", params: { ids: customerSelection.selection.selectedIds.join(",") } })
                }
                onShare={() => void customerSelection.share()}
                onShareByEmail={() => void customerSelection.shareByEmail()}
                onViewSelection={customerSelection.openList}
                loadingSelectionData={customerSelection.totalsLoading}
                previewCustomerCount={customerSelection.exportPreview?.customerCount ?? customerSelection.selectedMarkers.length}
                previewOpenOrderCount={customerSelection.exportPreview?.openOrderCount ?? customerSelection.selectedMarkers.reduce((sum, marker) => sum + marker.openOrderCount, 0)}
                selectedCount={customerSelection.selectedMarkers.length}
                shareError={customerSelection.shareError}
                sharing={customerSelection.sharing}
              />
            </AnimatedEntrance>
          ) : null}
        </View>
      </SafeAreaView>

      <View pointerEvents="box-none" style={[styles.bottomOverlay, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}>
        <PolygonDrawOverlay
          onClosePolygon={customerSelection.selection.closePolygon}
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
        visible={selectedCustomerId !== null && !completeConfirmVisible}
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
      <ContactMethodSheet
        onCallPhone={() => void mapActions.callByPhone()}
        onCallWhatsapp={() => void mapActions.callByWhatsapp()}
        onClose={mapActions.closeContactSheet}
        visible={mapActions.contactSheetVisible}
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
  inlineControls: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "flex-start",
  },
  bottomOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});

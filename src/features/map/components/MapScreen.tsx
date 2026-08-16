import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView from "react-native-maps";
import { mapT } from "@/src/features/map/i18n/mapT";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { spacing } from "@/src/constants/spacing";
import { CustomerMarker } from "@/src/features/map/components/CustomerMarker";
import { MapCustomerSheet } from "@/src/features/map/components/MapCustomerSheet";
import { MapFilters } from "@/src/features/map/components/MapFilters";
import { MapSelectionToolbar } from "@/src/features/map/components/MapSelectionToolbar";
import { MapToolbar } from "@/src/features/map/components/MapToolbar";
import { PolygonDrawOverlay } from "@/src/features/map/components/PolygonDrawOverlay";
import { PolygonSelectionOverlay } from "@/src/features/map/components/PolygonSelectionOverlay";
import { SelectedCustomersBar } from "@/src/features/map/components/SelectedCustomersBar";
import { SelectedCustomersList } from "@/src/features/map/components/SelectedCustomersList";
import { useMapActions } from "@/src/features/map/hooks/useMapActions";
import { useMapCustomerDetails } from "@/src/features/map/hooks/useMapCustomerDetails";
import { useMapCustomers } from "@/src/features/map/hooks/useMapCustomers";
import { useMapCustomerSelection } from "@/src/features/map/hooks/useMapCustomerSelection";
import { useMapFilters } from "@/src/features/map/hooks/useMapFilters";
import { mapClusteringService } from "@/src/features/map/services/mapClusteringService";
import { useUserLocation } from "@/src/features/map/hooks/useUserLocation";

const TAB_BAR_CLEARANCE = 68 + 14 + spacing.sm;

export function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = mapT;
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [completeConfirmVisible, setCompleteConfirmVisible] = useState(false);
  const { error, hasPermission, isLoading, region, reload } = useUserLocation();
  const { error: customersError, isLoading: customersLoading, markers, reload: reloadCustomers } = useMapCustomers();
  const { filters, filteredMarkers, countryOptions, cityOptions, regionOptions, resetFilters, selectCity, selectCountry, selectRegion } = useMapFilters(markers);
  const [visibleRegion, setVisibleRegion] = useState(region);
  const { details, error: detailsError, isLoading: detailsLoading, reload: reloadDetails } = useMapCustomerDetails(selectedCustomerId);
  const selectedMarker = useMemo(() => filteredMarkers.find((value) => value.id === selectedCustomerId) ?? null, [filteredMarkers, selectedCustomerId]);
  const mapActions = useMapActions(details, selectedMarker);
  const productEmojiById = useMemo(() => new Map(mapActions.products.map((product) => [product.id, product.emoji])), [mapActions.products]);
  const customerSelection = useMapCustomerSelection(markers, filteredMarkers, productEmojiById);
  const selectedIdSet = useMemo(() => new Set(customerSelection.selection.selectedIds), [customerSelection.selection.selectedIds]);
  const drawingSelection = customerSelection.selection.activeTool === "polygon";
  const drawingPaused = customerSelection.selection.polygonPaused;
  const mapGesturesEnabled = !drawingSelection || drawingPaused;
  const clusterItems = useMemo(
    () => mapClusteringService.buildClusterItems({ markers: filteredMarkers, region: visibleRegion }),
    [filteredMarkers, visibleRegion],
  );

  useEffect(() => {
    setVisibleRegion(region);
  }, [region]);

  useFocusEffect(useCallback(() => {
    void reloadCustomers();
    if (selectedCustomerId) void reloadDetails();
  }, [reloadCustomers, reloadDetails, selectedCustomerId]));

  useEffect(() => {
    if (!mapRef.current) return;
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
  }, [filteredMarkers]);

  async function handleConfirmComplete() {
    setCompleteConfirmVisible(false);
    const completed = await mapActions.completeOpenOrder();
    if (!completed) return;
    setSelectedCustomerId(null);
    await reloadCustomers();
  }

  if (isLoading) return <LoadingView label={t("screen.loading")} />;

  return (
    <View style={styles.screen}>
      <MapView
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
        style={StyleSheet.absoluteFillObject}
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
      </MapView>

      <SafeAreaView edges={["top"]} pointerEvents="box-none" style={styles.topOverlay}>
        <View style={styles.topOverlayContent}>
          <AnimatedEntrance>
            <MapToolbar
              customersError={customersError}
              customersLoading={customersLoading}
              filteredCount={filteredMarkers.length}
              locationError={error}
              locationPermissionDenied={!hasPermission}
              onRetryCustomers={() => void reloadCustomers()}
              onRetryLocation={() => void reload()}
            />
          </AnimatedEntrance>
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
                    onRegionChange={selectRegion}
                    onReset={resetFilters}
                    regionOptions={regionOptions}
                  />
                </View>
              }
            />
          </AnimatedEntrance>
          {!drawingSelection ? (
            <AnimatedEntrance delay={80}>
              <SelectedCustomersBar
                emailing={customerSelection.emailing}
                inline
                onResetSelection={customerSelection.resetSelection}
                onShare={() => void customerSelection.share()}
                onShareByEmail={() => void customerSelection.shareByEmail()}
                onViewSelection={customerSelection.openList}
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
        details={details}
        error={detailsError}
        loading={detailsLoading}
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
        visible={selectedCustomerId !== null}
      />
      <ConfirmDialog
        destructive
        message={
          (details?.openOrders.length ?? 0) > 1
            ? t("sheet.completeAllConfirmMessage", { count: details?.openOrders.length ?? 0 })
            : t("sheet.completeConfirmMessage")
        }
        onCancel={() => setCompleteConfirmVisible(false)}
        onConfirm={() => void handleConfirmComplete()}
        title={t("sheet.completeConfirmTitle")}
        visible={completeConfirmVisible}
      />
    </View>
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

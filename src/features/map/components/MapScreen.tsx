import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView, StyleSheet, View } from "react-native";
import MapView from "react-native-maps";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
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
import { useUserLocation } from "@/src/features/map/hooks/useUserLocation";
import { useThemeColors } from "@/src/hooks/useThemeColors";

export function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const router = useRouter();
  const colors = useThemeColors();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const { error, hasPermission, isLoading, region, reload } = useUserLocation();
  const { error: customersError, isLoading: customersLoading, markers, reload: reloadCustomers } = useMapCustomers();
  const { filters, filteredMarkers, countryOptions, cityOptions, regionOptions, resetFilters, selectCity, selectCountry, selectRegion } = useMapFilters(markers);
  const { details, error: detailsError, isLoading: detailsLoading, reload: reloadDetails } = useMapCustomerDetails(selectedCustomerId);
  const selectedMarker = useMemo(() => filteredMarkers.find((value) => value.id === selectedCustomerId) ?? null, [filteredMarkers, selectedCustomerId]);
  const mapActions = useMapActions(details, selectedMarker);
  const productEmojiById = useMemo(() => new Map(mapActions.products.map((product) => [product.id, product.emoji])), [mapActions.products]);
  const customerSelection = useMapCustomerSelection(markers, filteredMarkers, productEmojiById);
  const selectedIdSet = useMemo(() => new Set(customerSelection.selection.selectedIds), [customerSelection.selection.selectedIds]);
  const drawingSelection = customerSelection.selection.activeTool === "polygon";

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

  if (isLoading) return <LoadingView label="Karte wird vorbereitet..." />;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!drawingSelection}
        showsVerticalScrollIndicator={false}
      >
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
          <MapFilters
            cityOptions={cityOptions}
            countryOptions={countryOptions}
            filters={filters}
            onCityChange={selectCity}
            onCountryChange={selectCountry}
            onRegionChange={selectRegion}
            onReset={resetFilters}
            regionOptions={regionOptions}
          />
        </AnimatedEntrance>
        {!drawingSelection ? (
          <SelectedCustomersBar
            onResetSelection={customerSelection.resetSelection}
            onShare={() => void customerSelection.share()}
            onViewSelection={customerSelection.openList}
            selectedCount={customerSelection.selectedMarkers.length}
            shareError={customerSelection.shareError}
            sharing={customerSelection.sharing}
          />
        ) : null}
        <AnimatedEntrance delay={60}>
          <MapSelectionToolbar
            activeTool={customerSelection.selection.activeTool}
            onResetSelection={customerSelection.resetSelection}
            onSelectTool={customerSelection.selection.selectTool}
          />
        </AnimatedEntrance>
        <View style={styles.mapWrapper}>
          <MapView
            initialRegion={region}
            onPanDrag={(event) => {
              if (customerSelection.selection.activeTool === "polygon") {
                customerSelection.selection.handleMapDrag(event.nativeEvent.coordinate);
              }
            }}
            ref={mapRef}
            pitchEnabled={!drawingSelection}
            rotateEnabled={!drawingSelection}
            scrollEnabled={!drawingSelection}
            showsCompass
            showsUserLocation={hasPermission}
            style={[styles.map, { borderColor: colors.border }]}
            zoomEnabled={!drawingSelection}
          >
            {filteredMarkers.map((marker) => (
              <CustomerMarker
                key={marker.id}
                marker={marker}
                onPress={() => {
                  if (customerSelection.selection.activeTool === "single") return customerSelection.selection.handleMarkerPress(marker);
                  if (customerSelection.selection.activeTool !== "none") return;
                  setSelectedCustomerId(marker.id);
                }}
                selected={selectedIdSet.has(marker.id)}
              />
            ))}
            <PolygonSelectionOverlay confirmedPolygon={customerSelection.selection.polygonConfirmed} draftPoints={customerSelection.selection.polygonPoints} />
          </MapView>
        </View>
        <PolygonDrawOverlay
          onClosePolygon={customerSelection.selection.closePolygon}
          onUndoPolygonPoint={customerSelection.selection.undoPolygonPoint}
          polygonPointCount={customerSelection.selection.polygonPoints.length}
          visible={customerSelection.selection.activeTool === "polygon"}
        />
      </ScrollView>
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
        onClose={() => setSelectedCustomerId(null)}
        onEdit={() => {
          if (selectedCustomerId) router.push(`/customer/edit/${selectedCustomerId}`);
        }}
        onComplete={() => void (async () => {
          const completed = await mapActions.completeOpenOrder();
          if (!completed) return;
          setSelectedCustomerId(null);
          await reloadCustomers();
        })()}
        completing={mapActions.completingOrder}
        onNavigate={() => void mapActions.openNavigationMenu()}
        onRetry={() => void reloadDetails()}
        onShare={() => void mapActions.shareLocation()}
        onShareOrder={() => void mapActions.shareOrder()}
        visible={selectedCustomerId !== null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  mapWrapper: {
    position: "relative",
  },
  map: {
    height: 420,
    borderRadius: 24,
    borderWidth: 1,
  },
});

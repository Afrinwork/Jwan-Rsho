import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import MapView from "react-native-maps";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { LoadingView } from "@/src/components/ui/LoadingView";
import { colors } from "@/src/constants/colors";
import { spacing } from "@/src/constants/spacing";
import { CircleSelectionOverlay } from "@/src/features/map/components/CircleSelectionOverlay";
import { CustomerMarker } from "@/src/features/map/components/CustomerMarker";
import { MapFilters } from "@/src/features/map/components/MapFilters";
import { MapCustomerSheet } from "@/src/features/map/components/MapCustomerSheet";
import { MapSelectionToolbar } from "@/src/features/map/components/MapSelectionToolbar";
import { MapToolbar } from "@/src/features/map/components/MapToolbar";
import { NavigationAppSheet } from "@/src/features/map/components/NavigationAppSheet";
import { PolygonSelectionOverlay } from "@/src/features/map/components/PolygonSelectionOverlay";
import { SelectedCustomersBar } from "@/src/features/map/components/SelectedCustomersBar";
import { SelectedCustomersList } from "@/src/features/map/components/SelectedCustomersList";
import { useMapActions } from "@/src/features/map/hooks/useMapActions";
import { useMapCustomerDetails } from "@/src/features/map/hooks/useMapCustomerDetails";
import { useMapCustomers } from "@/src/features/map/hooks/useMapCustomers";
import { useMapCustomerSelection } from "@/src/features/map/hooks/useMapCustomerSelection";
import { useMapFilters } from "@/src/features/map/hooks/useMapFilters";
import { useUserLocation } from "@/src/features/map/hooks/useUserLocation";

export function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const router = useRouter();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const { error, hasPermission, isLoading, region, reload } = useUserLocation();
  const {
    error: customersError,
    isLoading: customersLoading,
    markers,
    reload: reloadCustomers,
  } = useMapCustomers();
  const {
    filters,
    filteredMarkers,
    countryOptions,
    cityOptions,
    regionOptions,
    resetFilters,
    selectCity,
    selectCountry,
    selectRegion,
  } = useMapFilters(markers);
  const {
    details,
    error: detailsError,
    isLoading: detailsLoading,
    reload: reloadDetails,
  } = useMapCustomerDetails(selectedCustomerId);
  const selectedMarker = useMemo(
    () => filteredMarkers.find((value) => value.id === selectedCustomerId) ?? null,
    [filteredMarkers, selectedCustomerId],
  );
  const mapActions = useMapActions(details, selectedMarker);
  const customerSelection = useMapCustomerSelection(markers, filteredMarkers);
  const selectedIdSet = useMemo(
    () => new Set(customerSelection.selection.selectedIds),
    [customerSelection.selection.selectedIds],
  );

  useFocusEffect(
    useCallback(() => {
      void reloadCustomers();
      if (selectedCustomerId) {
        void reloadDetails();
      }
    }, [reloadCustomers, reloadDetails, selectedCustomerId]),
  );

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (filteredMarkers.length === 1) {
      const marker = filteredMarkers[0];
      mapRef.current.animateToRegion({
        latitude: marker.latitude,
        longitude: marker.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      return;
    }

    if (filteredMarkers.length > 1) {
      mapRef.current.fitToCoordinates(
        filteredMarkers.map((value) => ({
          latitude: value.latitude,
          longitude: value.longitude,
        })),
        {
          animated: true,
          edgePadding: {
            top: 80,
            right: 80,
            bottom: 80,
            left: 80,
          },
        },
      );
    }
  }, [filteredMarkers]);

  if (isLoading) {
    return <LoadingView label="Karte wird vorbereitet..." />;
  }

  return (
    <View style={styles.screen}>
      <MapToolbar
        customersError={customersError}
        customersLoading={customersLoading}
        filteredCount={filteredMarkers.length}
        locationError={error}
        locationPermissionDenied={!hasPermission}
        onRetryCustomers={() => void reloadCustomers()}
        onRetryLocation={() => void reload()}
      />
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
      <MapSelectionToolbar
        activeTool={customerSelection.selection.activeTool}
        onClosePolygon={customerSelection.selection.closePolygon}
        onResetSelection={customerSelection.resetSelection}
        onSelectTool={customerSelection.selection.selectTool}
        onUndoPolygonPoint={customerSelection.selection.undoPolygonPoint}
        polygonPointCount={customerSelection.selection.polygonPoints.length}
      />
      <MapView
        initialRegion={region}
        onPress={(event) => {
          if (customerSelection.selection.activeTool === "circle" || customerSelection.selection.activeTool === "polygon") {
            customerSelection.selection.handleMapPress(event.nativeEvent.coordinate);
          }
        }}
        ref={mapRef}
        showsCompass
        showsUserLocation={hasPermission}
        style={styles.map}
      >
        {filteredMarkers.map((marker) => (
          <CustomerMarker
            key={marker.id}
            marker={marker}
            onPress={() => {
              if (customerSelection.selection.activeTool === "single") {
                customerSelection.selection.handleMarkerPress(marker);
                return;
              }
              if (customerSelection.selection.activeTool !== "none") {
                return;
              }
              setSelectedCustomerId(marker.id);
            }}
            selected={selectedIdSet.has(marker.id)}
          />
        ))}
        <CircleSelectionOverlay
          confirmedCircle={customerSelection.selection.circleConfirmed}
          draftCenter={customerSelection.selection.circleDraftCenter}
        />
        <PolygonSelectionOverlay
          confirmedPolygon={customerSelection.selection.polygonConfirmed}
          draftPoints={customerSelection.selection.polygonPoints}
        />
      </MapView>
      <SelectedCustomersBar
        onResetSelection={customerSelection.resetSelection}
        onShare={() => void customerSelection.share()}
        onViewSelection={customerSelection.openList}
        selectedCount={customerSelection.selectedMarkers.length}
        shareError={customerSelection.shareError}
        sharing={customerSelection.sharing}
      />
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
          if (selectedCustomerId) {
            router.push(`/customer/edit/${selectedCustomerId}`);
          }
        }}
        onNavigate={() => void mapActions.openNavigationMenu()}
        onRetry={() => void reloadDetails()}
        onShare={() => void mapActions.shareLocation()}
        visible={selectedCustomerId !== null}
      />
      <NavigationAppSheet
        apps={mapActions.navigationApps}
        onClose={mapActions.closeNavigationSheet}
        onSelect={(appId) => void mapActions.openNavigationApp(appId)}
        visible={mapActions.navigationSheetVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

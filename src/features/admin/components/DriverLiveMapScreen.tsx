import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppErrorBoundary } from "@/src/components/layout/AppErrorBoundary";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/constants/spacing";
import { AppMapView } from "@/src/features/map/components/AppMapView";
import { DriverPositionPin } from "@/src/features/admin/components/DriverPositionPin";
import { useDriverAssignedMarkers } from "@/src/features/admin/hooks/useDriverAssignedMarkers";
import { RouteStopMarker } from "@/src/features/route/components/RouteStopMarker";
import { MapRegion } from "@/src/features/map/types/mapTypes";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { formatTime } from "@/src/utils/date";

const FALLBACK_REGION: MapRegion = { latitude: 52.52, longitude: 13.405, latitudeDelta: 5, longitudeDelta: 5 };
const DEFAULT_DELTA = { latitudeDelta: 0.08, longitudeDelta: 0.08 };

export type DriverLocation = {
  latitude: number;
  longitude: number;
  address: string;
  updatedAt: string;
};

type DriverLiveMapScreenProps = {
  driverName: string;
  customerIds: string[];
  location: DriverLocation | null;
  openCount: number;
  completedToday: number;
};

// Read-only "where is this driver, and what's left" map for admin/super_admin
// -- deliberately not the same screen a driver uses to plan/draw/start a
// route: no selection tools, no "start trip" button, nothing an admin could
// accidentally trigger on the driver's behalf. Just the driver's last
// reported position plus pins for their currently open stops.
export function DriverLiveMapScreen(props: DriverLiveMapScreenProps) {
  const { t } = useTranslation("admin");
  const colors = useThemeColors();
  const { markers, loading, error } = useDriverAssignedMarkers(props.customerIds);

  const initialRegion: MapRegion = useMemo(() => {
    if (props.location) {
      return { latitude: props.location.latitude, longitude: props.location.longitude, ...DEFAULT_DELTA };
    }
    if (markers.length) {
      return { latitude: markers[0].latitude, longitude: markers[0].longitude, ...DEFAULT_DELTA };
    }
    return FALLBACK_REGION;
  }, [props.location, markers]);

  return (
    <AppErrorBoundary>
      <View style={styles.screen}>
        <AppMapView initialRegion={initialRegion} showsCompass style={StyleSheet.absoluteFill}>
          {props.location ? (
            <DriverPositionPin coordinate={{ latitude: props.location.latitude, longitude: props.location.longitude }} title={props.driverName} />
          ) : null}
          {markers.map((marker, index) => (
            <RouteStopMarker key={marker.id} active={false} label={String(index + 1)} marker={marker} onPress={() => undefined} />
          ))}
        </AppMapView>

        <SafeAreaView edges={["top"]} pointerEvents="box-none" style={styles.overlay}>
          <AppCard frosted style={styles.card}>
            <View style={styles.headerRow}>
              <AppText style={styles.title} variant="title">
                {props.driverName}
              </AppText>
              {loading ? <ActivityIndicator color={colors.primary} /> : null}
            </View>
            <AppText color="muted" variant="caption">
              {t("driverMap.progress", { open: props.openCount, completed: props.completedToday })}
            </AppText>
            <AppText color="muted" variant="caption">
              {props.location
                ? t("driverMap.lastUpdate", { time: formatTime(props.location.updatedAt), address: props.location.address })
                : t("driverMap.noLocation")}
            </AppText>
            {error ? <ErrorState message={error} /> : null}
          </AppCard>
        </SafeAreaView>
      </View>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  overlay: { position: "absolute", left: 0, right: 0, top: 0 },
  card: { margin: spacing.sm, gap: spacing.xs },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  title: { flexShrink: 1 },
});

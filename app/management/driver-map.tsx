import { useLocalSearchParams } from "expo-router";

import { DriverLiveMapScreen } from "@/src/features/admin/components/DriverLiveMapScreen";

export default function DriverMapRoute() {
  const params = useLocalSearchParams<{
    driverName?: string;
    ids?: string;
    lat?: string;
    lng?: string;
    address?: string;
    updatedAt?: string;
    openCount?: string;
    completedToday?: string;
  }>();

  const lat = params.lat ? Number(params.lat) : NaN;
  const lng = params.lng ? Number(params.lng) : NaN;

  return (
    <DriverLiveMapScreen
      completedToday={Number(params.completedToday ?? 0)}
      customerIds={params.ids ? params.ids.split(",") : []}
      driverName={params.driverName ?? ""}
      location={Number.isFinite(lat) && Number.isFinite(lng) ? { latitude: lat, longitude: lng, address: params.address ?? "", updatedAt: params.updatedAt ?? "" } : null}
      openCount={Number(params.openCount ?? 0)}
    />
  );
}

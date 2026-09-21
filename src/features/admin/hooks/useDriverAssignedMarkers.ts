import { useEffect, useState } from "react";

import { hasValidCoordinates } from "@/src/features/map/services/mapCustomerService";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { customerRepository } from "@/src/repositories/customerRepository";
import { formatError } from "@/src/utils/formatError";

// Read-only marker set for the admin "driver view" map -- takes the
// customer ids already assigned to that driver (from the driver dashboard's
// open-order count) and turns them into map pins. No order data is
// refetched here: this screen only shows WHERE the driver's open stops
// are, not a fully interactive order/selection flow.
export function useDriverAssignedMarkers(customerIds: string[]) {
  const [markers, setMarkers] = useState<MapCustomerMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const idsKey = customerIds.join(",");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void customerRepository
      .getCustomersByIds(idsKey ? idsKey.split(",") : [])
      .then((customers) => {
        if (cancelled) return;

        const built: MapCustomerMarker[] = customers.filter(hasValidCoordinates).map((customer, index) => ({
          id: customer.id,
          title: customer.fullName,
          description: [customer.address, customer.city].filter((part) => part.trim()).join(", "),
          phone: customer.phone,
          note: customer.note ?? "",
          latitude: customer.latitude,
          longitude: customer.longitude,
          numberLabel: String(index + 1),
          openOrderCount: 1,
          country: customer.country,
          city: customer.city,
          region: customer.region ?? "",
        }));

        setMarkers(built);
      })
      .catch((loadError) => {
        if (!cancelled) setError(formatError(loadError).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return { markers, loading, error };
}

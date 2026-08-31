import { useCallback, useMemo, useState } from "react";

import { routeT } from "@/src/features/route/i18n/routeT";
import { buildRouteWhatsappMessages } from "@/src/features/route/services/routeShareFormatterService";
import { RouteStop } from "@/src/features/route/types/routeTypes";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { sharingService } from "@/src/services/sharingService";
import { OrderWithItems } from "@/src/types/order";
import { formatError } from "@/src/utils/formatError";

type UseRouteSelectionActionsOptions = {
  selectedStops: RouteStop[];
  reload: () => Promise<void>;
};

export function useRouteSelectionActions({ selectedStops, reload }: UseRouteSelectionActionsOptions) {
  const t = routeT;
  const [sharing, setSharing] = useState(false);
  const [completingAll, setCompletingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedMarkerIds = useMemo(() => selectedStops.map((stop) => stop.marker.id), [selectedStops]);

  const loadOrders = useCallback(async () => {
    if (!selectedMarkerIds.length) {
      return [] as OrderWithItems[];
    }

    return orderDetailsRepository.getOpenOrdersWithItemsByCustomerIds(selectedMarkerIds);
  }, [selectedMarkerIds]);

  const share = useCallback(async () => {
    setActionError(null);
    setSharing(true);

    try {
      const messages = await buildSelectionMessages({ loadOrders, selectedStops });

      if (!messages.length) {
        setActionError(t("selectionActions.noCustomersSelected"));
        return;
      }

      await sharingService.shareTextsViaWhatsApp(messages);
    } catch (error) {
      setActionError(formatError(error).message);
    } finally {
      setSharing(false);
    }
  }, [loadOrders, selectedStops, t]);

  const completeAllOpenOrders = useCallback(async () => {
    setActionError(null);
    setCompletingAll(true);

    try {
      const orders = await loadOrders();

      if (!orders.length) {
        setActionError(t("selectionActions.noOpenOrdersSelected"));
        return false;
      }

      await Promise.all(orders.map((order) => orderRepository.completeOrder(order.id)));
      await reload();
      return true;
    } catch (error) {
      setActionError(formatError(error).message);
      return false;
    } finally {
      setCompletingAll(false);
    }
  }, [loadOrders, reload, t]);

  return {
    sharing,
    completingAll,
    actionError,
    clearActionError: () => setActionError(null),
    share,
    completeAllOpenOrders,
  };
}

async function buildSelectionMessages({
  loadOrders,
  selectedStops,
}: {
  loadOrders: () => Promise<OrderWithItems[]>;
  selectedStops: RouteStop[];
}) {
  const orders = await loadOrders();
  const ordersByCustomerId = new Map<string, OrderWithItems[]>();
  orders.forEach((order) => {
    ordersByCustomerId.set(order.customerId, [...(ordersByCustomerId.get(order.customerId) ?? []), order]);
  });

  return buildRouteWhatsappMessages(
    selectedStops.map((stop) => ({
      stop,
      orders: ordersByCustomerId.get(stop.marker.id) ?? [],
    })),
  );
}

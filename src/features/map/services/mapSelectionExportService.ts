import { MapCircleSelection, MapSelectionPoint } from "@/src/features/map/types/mapSelectionTypes";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { LatLng, estimateArrivalLabel } from "@/src/features/map/services/mapShareEtaService";
import {
  buildSelectionShareMessage,
  SelectionShareCustomer,
  SelectionShareItem,
} from "@/src/features/map/services/mapShareFormatterService";
import { mapSelectionService } from "@/src/features/map/services/mapSelectionService";
import { Customer } from "@/src/types/customer";
import { OrderWithItems } from "@/src/types/order";
import { ProductTotal } from "@/src/types/productTotal";
import { WhatsappMessageComponent } from "@/src/types/userPreferences";
import { buildProductTotals } from "@/src/utils/orderItemTotals";

export type SelectionExportSnapshot = {
  customerIds: string[];
  customers: SelectionShareCustomer[];
  orders: OrderWithItems[];
  totals: SelectionShareItem[];
  customerCount: number;
  openOrderCount: number;
  customersWithoutOpenOrders: SelectionShareCustomer[];
  message: string;
};

export type SelectionExportOptions = {
  includeAddress?: boolean;
  includePhone?: boolean;
  includeTotal?: boolean;
  shopName?: string;
  messageTemplate?: string;
  components?: WhatsappMessageComponent[];
  // The sharer's own current GPS position -- only used when `components`
  // includes "eta" (see mapShareEtaService.ts). Omitted/null just means no
  // arrival-time line is added, never a crash or a fake guess.
  origin?: LatLng | null;
};

export function canStartSelectionExport(state: { sharing: boolean; emailing: boolean }) {
  return !state.sharing && !state.emailing;
}

export function getCustomerIdsInsideShape(
  markers: MapCustomerMarker[],
  shape:
    | { type: "circle"; circle: MapCircleSelection }
    | { type: "polygon"; polygon: MapSelectionPoint[] },
) {
  const ids =
    shape.type === "circle"
      ? mapSelectionService.getMarkerIdsInCircle(markers, shape.circle)
      : mapSelectionService.getMarkerIdsInPolygon(markers, shape.polygon);

  return uniqueStable(ids);
}

export function loadCustomersByIds(customers: Customer[], ids: string[]) {
  const orderedIds = uniqueStable(ids);
  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  return orderedIds.map((id) => customersById.get(id)).filter((customer): customer is Customer => Boolean(customer));
}

export function buildEmailExport({
  customerIds,
  markers,
  orders,
  productEmojiById,
  totals,
  options,
}: {
  customerIds: string[];
  markers: MapCustomerMarker[];
  orders: OrderWithItems[];
  productEmojiById: Map<string, string | undefined>;
  totals?: ProductTotal[];
  options?: SelectionExportOptions;
}): SelectionExportSnapshot {
  const uniqueCustomerIds = uniqueStable(customerIds);
  const markersById = new Map(markers.map((marker) => [marker.id, marker]));
  const ordersByCustomerId = groupOrdersByCustomerId(orders);
  const includeEta = Boolean(options?.components?.includes("eta"));
  const customers = uniqueCustomerIds
    .map((id) => markersById.get(id))
    .filter((marker): marker is MapCustomerMarker => Boolean(marker))
    .map((marker) =>
      buildShareCustomer(marker, ordersByCustomerId.get(marker.id) ?? [], productEmojiById, includeEta ? options?.origin : null),
    );
  const exportTotals = enrichTotalsWithEmoji(totals ?? buildProductTotals(orders), productEmojiById);

  return {
    customerIds: uniqueCustomerIds,
    customers,
    orders,
    totals: exportTotals,
    customerCount: customers.length,
    openOrderCount: orders.length,
    customersWithoutOpenOrders: customers.filter((customer) => customer.items.length === 0),
    message: buildSelectionShareMessage(customers, exportTotals, options),
  };
}

function uniqueStable(ids: string[]) {
  return [...new Set(ids.filter((id) => id.trim()))];
}

function groupOrdersByCustomerId(orders: OrderWithItems[]) {
  const ordersByCustomerId = new Map<string, OrderWithItems[]>();

  orders.forEach((order) => {
    ordersByCustomerId.set(order.customerId, [...(ordersByCustomerId.get(order.customerId) ?? []), order]);
  });

  return ordersByCustomerId;
}

function buildShareCustomer(
  marker: MapCustomerMarker,
  customerOrders: OrderWithItems[],
  productEmojiById: Map<string, string | undefined>,
  etaOrigin?: LatLng | null,
): SelectionShareCustomer {
  return {
    fullName: marker.title,
    address: marker.description,
    phone: marker.phone,
    city: marker.city,
    note: marker.note,
    orderCount: customerOrders.length,
    etaLabel: etaOrigin ? estimateArrivalLabel(etaOrigin, marker) : undefined,
    items: customerOrders.flatMap((order) =>
      order.items.map((item) => ({
        productName: item.productNameSnapshot,
        quantity: item.quantity,
        unit: item.unit,
        emoji: productEmojiById.get(item.productId),
      })),
    ),
  };
}

function enrichTotalsWithEmoji(
  totals: ProductTotal[],
  productEmojiById: Map<string, string | undefined>,
): SelectionShareItem[] {
  return totals.map((total) => ({
    productName: total.productName,
    quantity: total.quantity,
    unit: total.unit,
    emoji: productEmojiById.get(total.productKey.split(":")[0]),
  }));
}

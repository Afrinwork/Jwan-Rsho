import { RouteStop } from "@/src/features/route/types/routeTypes";
import { routeT } from "@/src/features/route/i18n/routeT";
import { formatEtaTime } from "@/src/features/route/utils/routeFormat";
import { OrderWithItems } from "@/src/types/order";

type RouteShareEntry = {
  stop: RouteStop;
  orders: OrderWithItems[];
};

export type RouteWhatsappMessage = {
  name: string;
  message: string;
  phone: string;
};

export function buildRouteWhatsappMessages(entries: RouteShareEntry[]): RouteWhatsappMessage[] {
  if (!entries.length) {
    return [];
  }

  return entries.map(({ stop, orders }) => {
    const items = orders.flatMap((order) => order.items);
    const orderLines = items.length
      ? items.map((item) => `- ${item.productNameSnapshot}: ${item.quantity} ${item.unit}`)
      : ["- Keine offene Bestellung"];
    const addressLine = [stop.marker.description, stop.marker.city].filter((part) => part.trim()).join(", ");

    const lines = [
      `Name: ${stop.marker.title}`,
      addressLine ? `Adresse: ${addressLine}` : null,
      routeT("selectionActions.arrivalMessage", { time: formatEtaTime(stop.cumulativeEta) }),
      "",
      "Bestellung:",
      ...orderLines,
      "",
      "Danke fuer Ihre Bestellung.",
    ];

    return {
      name: stop.marker.title,
      phone: stop.marker.phone.trim(),
      message: lines.filter((line) => line !== null).join("\n"),
    };
  });
}

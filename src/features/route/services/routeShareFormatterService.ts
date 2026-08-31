import { RouteStop } from "@/src/features/route/types/routeTypes";
import { formatEtaTime } from "@/src/features/route/utils/routeFormat";
import { OrderWithItems } from "@/src/types/order";

type RouteShareEntry = {
  stop: RouteStop;
  orders: OrderWithItems[];
};

export type RouteWhatsappMessage = {
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
      : ["- لا توجد طلبية مفتوحة"];

    const lines = [
      `الاسم: ${stop.marker.title}`,
      `العنوان: ${buildAddressLine(stop)}`,
      stop.marker.phone.trim() ? `الهاتف: ${stop.marker.phone.trim()}` : null,
      "الطلب:",
      ...orderLines,
      `موعد الوصول التقريبي: ${formatEtaTime(stop.cumulativeEta)}`,
      "شكراً لثقتكم بنا، ونسعد بخدمتكم في الطلب القادم.",
      "راشو للأجبان",
    ];

    return {
      phone: stop.marker.phone.trim(),
      message: lines.filter(Boolean).join("\n"),
    };
  });
}

function buildAddressLine(stop: RouteShareEntry["stop"]) {
  return [stop.marker.description, stop.marker.city]
    .map((value) => value.trim())
    .filter(Boolean)
    .join("، ");
}

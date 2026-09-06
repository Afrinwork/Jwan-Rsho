import { RouteStop } from "@/src/features/route/types/routeTypes";
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
      : ["- لا توجد طلبية مفتوحة"];

    const lines = [
      `الاسم: ${stop.marker.title}`,
      stop.marker.phone.trim() ? `الهاتف: ${stop.marker.phone.trim()}` : null,
      "الطلب:",
      ...orderLines,
      `موعد الوصول التقريبي: ${formatEtaTime(stop.cumulativeEta)}`,
      "شكراً لثقتكم بنا، ونسعد بخدمتكم في الطلب القادم.",
    ];

    return {
      name: stop.marker.title,
      phone: stop.marker.phone.trim(),
      message: lines.filter(Boolean).join("\n"),
    };
  });
}

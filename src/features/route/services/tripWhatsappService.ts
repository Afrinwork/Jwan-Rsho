import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { buildSelectionShareMessage, ShareMessageLanguage } from "@/src/features/map/services/mapShareFormatterService";
import { formatEtaTime } from "@/src/features/route/utils/routeFormat";
import { OrderWithItems } from "@/src/types/order";
import { WhatsappMessageComponent } from "@/src/types/userPreferences";

// How wide the arrival time told to customers is — 0 = just "~04:17".
export const ARRIVAL_WINDOW_OPTIONS_MIN = [0, 10, 20, 30, 45, 60, 90, 120] as const;

// "~04:17", or with a window "04:17–04:47".
export function formatArrivalWindow(eta: Date, windowMinutes: number) {
  if (!windowMinutes) return `~${formatEtaTime(eta)}`;
  return `${formatEtaTime(eta)}–${formatEtaTime(new Date(eta.getTime() + windowMinutes * 60_000))}`;
}

// One customer's message: the WhatsApp text from the settings (intro and
// blocks in their order) with this customer's arrival time. The time is the
// point of this message, so it is added even when the blocks leave it out.
export function buildTripWhatsappMessage({
  marker,
  orders,
  productEmojiById,
  arrivalLabel,
  template,
  components,
  language,
}: {
  marker: MapCustomerMarker;
  orders: OrderWithItems[];
  productEmojiById: Map<string, string | undefined>;
  arrivalLabel: string | undefined;
  template: string;
  components: WhatsappMessageComponent[];
  language: ShareMessageLanguage;
}) {
  const withEta: WhatsappMessageComponent[] = components.includes("eta")
    ? components
    : [...components.slice(0, 1), "eta", ...components.slice(1)];

  return buildSelectionShareMessage(
    [
      {
        fullName: marker.title,
        address: marker.description,
        phone: marker.phone,
        city: marker.city,
        note: marker.note,
        orderCount: orders.length,
        etaLabel: arrivalLabel,
        items: orders.flatMap((order) =>
          order.items.map((item) => ({
            productName: item.productNameSnapshot,
            quantity: item.quantity,
            unit: item.unit,
            emoji: productEmojiById.get(item.productId),
          })),
        ),
      },
    ],
    [],
    { messageTemplate: template, components: withEta, language },
  );
}

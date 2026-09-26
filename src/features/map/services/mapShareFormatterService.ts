import { WhatsappMessageComponent } from "@/src/types/userPreferences";

const SEPARATOR = "--------------";

export type ShareMessageLanguage = "de" | "ar";

// Fixed labels of the auto-generated customer block, per message language
// (the sender's app language / the template tab being edited) — the
// customer-facing text must not mix German labels into an Arabic message.
const LABELS: Record<ShareMessageLanguage, {
  name: string;
  address: string;
  phone: string;
  eta: string;
  orders: string;
  noOrder: string;
  thankYou: string;
}> = {
  de: {
    name: "Name",
    address: "Adresse",
    phone: "Telefon",
    eta: "Ungefaehre Ankunft",
    orders: "Bestellung",
    noOrder: "Keine offene Bestellung",
    thankYou: "Danke fuer Ihre Bestellung.",
  },
  ar: {
    name: "الاسم",
    address: "العنوان",
    phone: "الهاتف",
    eta: "وقت الوصول التقريبي",
    orders: "الطلب",
    noOrder: "لا يوجد طلب مفتوح",
    thankYou: "شكراً لطلبكم.",
  },
};

// Matches the pre-existing hardcoded block exactly, for every caller that
// doesn't pass `components` (city screen share, email export, single-order
// share) -- none of those are affected by the WhatsApp template editor's
// new component toggles.
const DEFAULT_COMPONENTS: WhatsappMessageComponent[] = ["name", "address", "orders", "thankYou"];

export type SelectionShareItem = {
  productName: string;
  quantity: number;
  unit: string;
  emoji?: string;
};

export type SelectionShareCustomer = {
  fullName: string;
  address: string;
  phone: string;
  city: string;
  note?: string;
  orderCount?: number;
  items: SelectionShareItem[];
  // Pre-formatted ("~14:20") -- computed by the caller (needs the sharer's
  // live GPS position), never computed inside this pure formatter.
  etaLabel?: string;
};

export type SelectionShareOptions = {
  includeAddress?: boolean;
  includePhone?: boolean;
  includeTotal?: boolean;
  shopName?: string;
  messageTemplate?: string;
  components?: WhatsappMessageComponent[];
  // Language of the generated labels; German when omitted.
  language?: ShareMessageLanguage;
};

export function buildSelectionShareMessage(
  customers: SelectionShareCustomer[],
  _totals: SelectionShareItem[],
  options: SelectionShareOptions = {},
) {
  if (!customers.length) {
    return "";
  }

  // `components`, when given, is the single source of truth (including
  // for address) -- the older includeAddress flag only still matters for
  // callers that never pass components at all. Its ORDER is the order the
  // blocks appear in each customer's section (set in the WhatsApp template
  // editor); duplicates are ignored.
  const components = [
    ...new Set(
      options.components ?? DEFAULT_COMPONENTS.filter((component) => component !== "address" || (options.includeAddress ?? true)),
    ),
  ];
  const lines: string[] = [];
  const template = options.messageTemplate?.trim() ?? "";
  if (template) {
    lines.push(template, "", SEPARATOR, "");
  }

  customers.forEach((customer, index) => {
    pushCustomerBlock(lines, customer, components, LABELS[options.language ?? "de"]);
    if (index < customers.length - 1) {
      lines.push("", SEPARATOR, "");
    }
  });

  return lines.join("\n").trim();
}

function pushCustomerBlock(
  lines: string[],
  customer: SelectionShareCustomer,
  components: WhatsappMessageComponent[],
  labels: (typeof LABELS)[ShareMessageLanguage],
) {
  const blockStart = lines.length;
  // Multi-line blocks (orders, thank-you) are set off by a blank line —
  // except when they open the customer's section.
  const pushSpacer = () => {
    if (lines.length > blockStart) lines.push("");
  };

  for (const component of components) {
    switch (component) {
      case "name":
        lines.push(`${labels.name}: ${customer.fullName}`);
        break;
      case "address": {
        const addressLine = [customer.address, customer.city].filter((part) => part.trim()).join(", ");
        if (addressLine) lines.push(`${labels.address}: ${addressLine}`);
        break;
      }
      case "phone":
        if (customer.phone.trim()) lines.push(`${labels.phone}: ${customer.phone}`);
        break;
      case "eta":
        if (customer.etaLabel) lines.push(`${labels.eta}: ${customer.etaLabel}`);
        break;
      case "orders":
        pushSpacer();
        lines.push(`${labels.orders}:`);
        if (customer.items.length) {
          customer.items.forEach((item) => lines.push(formatItemLine(item)));
        } else {
          lines.push(labels.noOrder);
        }
        break;
      case "thankYou":
        pushSpacer();
        lines.push(labels.thankYou);
        break;
    }
  }
}

function formatItemLine(item: SelectionShareItem) {
  const emoji = item.emoji?.trim();
  return emoji ? `${emoji} ${item.productName}: ${item.quantity} ${item.unit}` : `${item.productName}: ${item.quantity} ${item.unit}`;
}

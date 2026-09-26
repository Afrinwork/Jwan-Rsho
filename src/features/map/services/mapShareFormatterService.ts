import { WhatsappMessageComponent } from "@/src/types/userPreferences";

const SEPARATOR = "--------------";
const THANK_YOU_MESSAGE = "Danke fuer Ihre Bestellung.";

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
    pushCustomerBlock(lines, customer, components);
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
        lines.push(`Name: ${customer.fullName}`);
        break;
      case "address": {
        const addressLine = [customer.address, customer.city].filter((part) => part.trim()).join(", ");
        if (addressLine) lines.push(`Adresse: ${addressLine}`);
        break;
      }
      case "phone":
        if (customer.phone.trim()) lines.push(`Telefon: ${customer.phone}`);
        break;
      case "eta":
        if (customer.etaLabel) lines.push(`Ungefaehre Ankunft: ${customer.etaLabel}`);
        break;
      case "orders":
        pushSpacer();
        lines.push("Bestellung:");
        if (customer.items.length) {
          customer.items.forEach((item) => lines.push(formatItemLine(item)));
        } else {
          lines.push("Keine offene Bestellung");
        }
        break;
      case "thankYou":
        pushSpacer();
        lines.push(THANK_YOU_MESSAGE);
        break;
    }
  }
}

function formatItemLine(item: SelectionShareItem) {
  const emoji = item.emoji?.trim();
  return emoji ? `${emoji} ${item.productName}: ${item.quantity} ${item.unit}` : `${item.productName}: ${item.quantity} ${item.unit}`;
}

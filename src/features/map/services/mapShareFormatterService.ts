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
  // callers that never pass components at all.
  const components = new Set(
    options.components ?? DEFAULT_COMPONENTS.filter((component) => component !== "address" || (options.includeAddress ?? true)),
  );
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
  components: Set<WhatsappMessageComponent>,
) {
  if (components.has("name")) {
    lines.push(`Name: ${customer.fullName}`);
  }

  if (components.has("address")) {
    const addressLine = [customer.address, customer.city].filter((part) => part.trim()).join(", ");
    if (addressLine) {
      lines.push(`Adresse: ${addressLine}`);
    }
  }

  if (components.has("phone") && customer.phone.trim()) {
    lines.push(`Telefon: ${customer.phone}`);
  }

  if (components.has("eta") && customer.etaLabel) {
    lines.push(`Ungefaehre Ankunft: ${customer.etaLabel}`);
  }

  if (components.has("orders")) {
    lines.push("", "Bestellung:");

    if (customer.items.length) {
      customer.items.forEach((item) => lines.push(formatItemLine(item)));
    } else {
      lines.push("Keine offene Bestellung");
    }
  }

  if (components.has("thankYou")) {
    lines.push("", THANK_YOU_MESSAGE);
  }
}

function formatItemLine(item: SelectionShareItem) {
  const emoji = item.emoji?.trim();
  return emoji ? `${emoji} ${item.productName}: ${item.quantity} ${item.unit}` : `${item.productName}: ${item.quantity} ${item.unit}`;
}

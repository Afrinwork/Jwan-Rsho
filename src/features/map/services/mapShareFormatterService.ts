import { mapT as t } from "@/src/features/map/i18n/mapT";

const SEPARATOR = "━━━━━━━━━━━━━━";
const DEFAULT_ITEM_EMOJI = "📦";
const KEYCAP_DIGITS = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

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
};

export type SelectionShareOptions = {
  includeAddress?: boolean;
  includePhone?: boolean;
  includeTotal?: boolean;
  shopName?: string;
};

export function buildSelectionShareMessage(
  customers: SelectionShareCustomer[],
  totals: SelectionShareItem[],
  options: SelectionShareOptions = {},
) {
  if (!customers.length) {
    return "";
  }

  const includeAddress = options.includeAddress ?? true;
  const includePhone = options.includePhone ?? false;
  const includeTotal = options.includeTotal ?? true;
  const shopName = options.shopName?.trim();

  const lines: string[] = [];

  pushHeader(lines, customers, shopName);
  lines.push("", SEPARATOR, "");

  customers.forEach((customer, index) => {
    pushCustomerBlock(lines, customer, index + 1, { includeAddress, includePhone });
    lines.push("", SEPARATOR, "");
  });

  if (includeTotal && totals.length) {
    lines.push(`📊 ${t("map:share.total")}`, "");
    totals.forEach((total) => lines.push(formatItemLine(total)));
    lines.push("", SEPARATOR, "");
  }

  lines.push(
    `👥 ${t("map:share.customerCount", { count: customers.length })}`,
    `📦 ${t("map:share.totalOrders", { count: totalOrderCount(customers) })}`,
  );

  if (shopName) {
    lines.push("", shopName);
  }

  return lines.join("\n").trim();
}

function pushHeader(lines: string[], customers: SelectionShareCustomer[], shopName: string | undefined) {
  if (shopName) {
    lines.push(shopName);
  }

  const cities = [...new Set(customers.map((customer) => customer.city.trim()).filter(Boolean))];
  if (cities.length === 1) {
    lines.push(`📍 ${cities[0]}`);
  } else if (cities.length > 1) {
    lines.push(`📍 ${t("map:share.multipleCities")}`);
  }

  lines.push(`📦 ${t("map:share.headerOrderCount", { count: totalOrderCount(customers) })}`);
}

function totalOrderCount(customers: SelectionShareCustomer[]) {
  return customers.reduce((sum, customer) => sum + (customer.orderCount ?? 1), 0);
}

function pushCustomerBlock(
  lines: string[],
  customer: SelectionShareCustomer,
  position: number,
  options: { includeAddress: boolean; includePhone: boolean },
) {
  lines.push(`${toKeycapNumber(position)} ${customer.fullName}`);

  if (options.includeAddress) {
    const addressLine = [customer.address, customer.city].filter((part) => part.trim()).join(", ");
    if (addressLine) {
      lines.push(`📍 ${addressLine}`);
    }
  }

  if (options.includePhone && customer.phone.trim()) {
    lines.push(`📞 ${customer.phone}`);
  }

  if (customer.orderCount && customer.orderCount > 1) {
    lines.push(`🧾 ${t("map:share.ordersCountLine", { count: customer.orderCount })}`);
  }

  lines.push("");

  if (customer.items.length) {
    customer.items.forEach((item) => lines.push(formatItemLine(item)));
  } else {
    lines.push(t("map:share.noOpenOrder"));
  }

  if (customer.note?.trim()) {
    lines.push("", `📝 ${t("map:share.note", { note: customer.note.trim() })}`);
  }
}

function formatItemLine(item: SelectionShareItem) {
  return `${item.emoji?.trim() || DEFAULT_ITEM_EMOJI} ${item.productName}: ${item.quantity} ${item.unit}`;
}

function toKeycapNumber(value: number) {
  return String(value)
    .split("")
    .map((digit) => KEYCAP_DIGITS[Number(digit)])
    .join("");
}

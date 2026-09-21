const SEPARATOR = "--------------";
const THANK_YOU_MESSAGE = "Danke fuer Ihre Bestellung.";

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
  messageTemplate?: string;
};

export function buildSelectionShareMessage(
  customers: SelectionShareCustomer[],
  _totals: SelectionShareItem[],
  options: SelectionShareOptions = {},
) {
  if (!customers.length) {
    return "";
  }

  const includeAddress = options.includeAddress ?? true;
  const lines: string[] = [];
  const template = formatTemplate(options.messageTemplate, customers.length, customers.reduce((sum, customer) => sum + (customer.orderCount ?? 0), 0));
  if (template) {
    lines.push(template, "", SEPARATOR, "");
  }

  customers.forEach((customer, index) => {
    pushCustomerBlock(lines, customer, { includeAddress });
    if (index < customers.length - 1) {
      lines.push("", SEPARATOR, "");
    }
  });

  return lines.join("\n").trim();
}

function formatTemplate(template: string | undefined, customerCount: number, orderCount: number) {
  return template?.trim()
    .replaceAll("{{kunden}}", String(customerCount))
    .replaceAll("{{bestellungen}}", String(orderCount)) ?? "";
}

function pushCustomerBlock(
  lines: string[],
  customer: SelectionShareCustomer,
  options: { includeAddress: boolean },
) {
  lines.push(`Name: ${customer.fullName}`);

  if (options.includeAddress) {
    const addressLine = [customer.address, customer.city].filter((part) => part.trim()).join(", ");
    if (addressLine) {
      lines.push(`Adresse: ${addressLine}`);
    }
  }

  lines.push("", "Bestellung:");

  if (customer.items.length) {
    customer.items.forEach((item) => lines.push(formatItemLine(item)));
  } else {
    lines.push("Keine offene Bestellung");
  }

  lines.push("", THANK_YOU_MESSAGE);
}

function formatItemLine(item: SelectionShareItem) {
  const emoji = item.emoji?.trim();
  return emoji ? `${emoji} ${item.productName}: ${item.quantity} ${item.unit}` : `${item.productName}: ${item.quantity} ${item.unit}`;
}

import { ProductTotal } from "@/src/types/productTotal";

export type SelectionShareItem = {
  productName: string;
  quantity: number;
  unit: string;
};

export type SelectionShareCustomer = {
  fullName: string;
  address: string;
  phone: string;
  city: string;
  items: SelectionShareItem[];
};

export type SelectionShareOptions = {
  includeAddress?: boolean;
  includePhone?: boolean;
  includeTotal?: boolean;
};

export function buildSelectionShareMessage(
  customers: SelectionShareCustomer[],
  totals: ProductTotal[],
  options: SelectionShareOptions = {},
) {
  if (!customers.length) {
    return "";
  }

  const includeAddress = options.includeAddress ?? true;
  const includePhone = options.includePhone ?? false;
  const includeTotal = options.includeTotal ?? true;
  const lines: string[] = [];
  let numberLabel = 0;

  groupByCity(customers).forEach((group) => {
    lines.push(group.city || "Ohne Stadt", "");

    group.customers.forEach((customer) => {
      numberLabel += 1;
      lines.push(`${numberLabel}. ${customer.fullName}`);

      if (includeAddress && customer.address.trim()) {
        lines.push(`   ${customer.address}`);
      }

      if (includePhone && customer.phone.trim()) {
        lines.push(`   ${customer.phone}`);
      }

      lines.push("");

      if (customer.items.length) {
        customer.items.forEach((item) =>
          lines.push(`- ${item.productName}: ${item.quantity} ${item.unit}`),
        );
      } else {
        lines.push("Keine offene Bestellung");
      }

      lines.push("");
    });
  });

  if (includeTotal && totals.length) {
    lines.push("Gesamt:", "");
    totals.forEach((total) =>
      lines.push(`- ${total.productName}: ${total.quantity} ${total.unit}`),
    );
  }

  return lines.join("\n").trim();
}

function groupByCity(customers: SelectionShareCustomer[]) {
  const groups = new Map<string, SelectionShareCustomer[]>();

  customers.forEach((customer) => {
    const existing = groups.get(customer.city) ?? [];
    existing.push(customer);
    groups.set(customer.city, existing);
  });

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([city, cityCustomers]) => ({ city, customers: cityCustomers }));
}

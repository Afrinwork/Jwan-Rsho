import { CustomerWrite } from "@/src/repositories/customerRepositoryData";
import { Customer } from "@/src/types/customer";

const EDITABLE_FIELDS = ["fullName", "phone", "note", "address", "city", "country", "region"] as const;
const LOCATION_FIELDS: ReadonlySet<string> = new Set(["address", "city", "country", "region"]);

type EditableCustomer = Pick<CustomerWrite, (typeof EDITABLE_FIELDS)[number]>;

// What was changed on the order form for a picked existing customer (e.g.
// the street added now). Saved with the order instead of silently dropped.
// null = nothing changed. locationChanged = the address needs geocoding again.
export function diffExistingCustomerEdits(customer: Customer, next: EditableCustomer) {
  const changed = EDITABLE_FIELDS.filter((key) => (next[key] ?? "") !== (customer[key] ?? ""));
  if (!changed.length) return null;

  const changes: Partial<CustomerWrite> = {};
  for (const key of changed) changes[key] = next[key] ?? "";
  return { changes, locationChanged: changed.some((key) => LOCATION_FIELDS.has(key)) };
}

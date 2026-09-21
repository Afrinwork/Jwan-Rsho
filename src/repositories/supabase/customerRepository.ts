import { buildCustomerCreateData, buildCustomerUpdateData, CustomerWrite } from "@/src/repositories/customerRepositoryData";
import { toCamelCase, toSnakeCase } from "@/src/repositories/supabase/caseMapping";
import { requireSupabase, resolveOwnerScope } from "@/src/repositories/supabase/repositoryContext";
import { cityRepository } from "@/src/repositories/supabase/cityRepository";
import { Customer } from "@/src/types/customer";
import type { Database } from "@/src/types/supabase";
import { generateUuid } from "@/src/utils/uuid";

type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];

// phone/address/city/country are nullable columns (unlike full_name, which
// is NOT NULL) -- a customer with none of these filled in is a normal,
// schema-permitted state, not corrupt data. The Customer type treats them
// as required strings, and plenty of call sites (search, sort, grouping)
// call .trim()/.toLowerCase() on them unconditionally, which throws on a
// real null and crashes whatever screen rendered that customer. Normalize
// once, here, at the single boundary every read of a customer row passes
// through, rather than guarding every call site individually.
function toCustomer(row: Record<string, unknown>): Customer {
  const customer = toCamelCase<Customer>(row);
  return {
    ...customer,
    phone: customer.phone ?? "",
    address: customer.address ?? "",
    city: customer.city ?? "",
    country: customer.country ?? "",
  };
}

export const customerRepository = {
  async createCustomer(input: CustomerWrite) {
    const { ownerId } = resolveOwnerScope();
    const timestamp = new Date().toISOString();
    const id = generateUuid();
    const { error } = await requireSupabase()
      .from("customers")
      .insert({
        ...toSnakeCase(buildCustomerCreateData(input, ownerId)),
        id,
        created_at: timestamp,
        updated_at: timestamp,
      } as CustomerInsert);
    if (error) throw error;

    await cityRepository.ensureCityExists(input.city).catch(() => undefined);
    return id;
  },

  async updateCustomer(id: string, input: Partial<CustomerWrite>) {
    await getOwnedCustomer(id);
    const { error } = await requireSupabase()
      .from("customers")
      .update({ ...toSnakeCase(buildCustomerUpdateData(input)), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    if (input.city) {
      await cityRepository.ensureCityExists(input.city).catch(() => undefined);
    }
  },

  // Assigns (or clears, when driverId is null) the customer's driver, and
  // mirrors the same value onto all of their currently open orders. Both
  // updates run in one server-side transaction (see
  // assign_customer_driver in supabase/migrations) so a mid-way failure
  // can't leave the customer and its open orders disagreeing about who's
  // assigned -- the Firestore version got this atomicity from writeBatch.
  async assignDriver(id: string, driverId: string | null) {
    await getOwnedCustomer(id);
    // The generated RPC arg type marks p_driver_id as non-nullable string
    // -- codegen doesn't infer nullability for plain function params, but
    // the underlying `uuid` parameter genuinely accepts NULL to clear the
    // assignment (see assign_customer_driver in supabase/migrations).
    const { error } = await requireSupabase().rpc("assign_customer_driver", {
      p_customer_id: id,
      p_driver_id: driverId,
    } as unknown as { p_customer_id: string; p_driver_id: string });
    if (error) throw error;
  },

  // Deleting a customer also deletes all of their orders (+ items) --
  // handled natively by ON DELETE CASCADE on orders.customer_id and
  // order_items.order_id in the schema, so unlike the Firestore version
  // there's no need to manually walk and delete each order/item first.
  async deleteCustomer(id: string) {
    await getOwnedCustomer(id);
    const { error } = await requireSupabase().from("customers").delete().eq("id", id);
    if (error) throw error;
  },

  async getCustomerById(id: string) {
    return getOwnedCustomer(id);
  },

  async getCustomers() {
    const { ownerId, driverId } = resolveOwnerScope();
    let queryBuilder = requireSupabase().from("customers").select("*").eq("owner_id", ownerId);
    if (driverId) queryBuilder = queryBuilder.eq("assigned_driver_id", driverId);

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return sortCustomers((data ?? []).map((row) => toCustomer(row)));
  },

  // Fetches only the given customer ids, filtered client-side against the
  // owner-scoped list rather than an `id in (...)` query -- kept
  // consistent with the Firestore version's reasoning (a stale id that no
  // longer belongs to the current owner should be silently dropped, not
  // cause the whole query to fail), even though Postgres RLS itself
  // wouldn't reject an "in" query the way Firestore's rules could.
  async getCustomersByIds(ids: string[]) {
    const uniqueIds = new Set(ids);
    if (uniqueIds.size === 0) return [];

    const customers = await this.getCustomers();
    return sortCustomers(customers.filter((value) => uniqueIds.has(value.id)));
  },

  async getCustomersByNormalizedCity(normalizedCity: string) {
    const { ownerId, driverId } = resolveOwnerScope();
    let queryBuilder = requireSupabase()
      .from("customers")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("normalized_city", normalizedCity);
    if (driverId) queryBuilder = queryBuilder.eq("assigned_driver_id", driverId);

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return sortCustomers((data ?? []).map((row) => toCustomer(row)));
  },

  async searchCustomers(searchTerm: string) {
    const term = searchTerm.trim().toLowerCase();
    const customers = await this.getCustomers();
    return customers.filter((value) =>
      [value.fullName, value.phone, value.city, value.address].some((field) => field.toLowerCase().includes(term)),
    );
  },

  async countCustomersByOwner(ownerId: string) {
    const { count, error } = await requireSupabase()
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", ownerId);
    if (error) throw error;
    return count ?? 0;
  },
};

async function getOwnedCustomer(id: string): Promise<Customer> {
  const { data, error } = await requireSupabase().from("customers").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Customer not found.");
  return toCustomer(data);
}

function sortCustomers(customers: Customer[]) {
  return [...customers].sort((left, right) => left.fullName.localeCompare(right.fullName, "de"));
}

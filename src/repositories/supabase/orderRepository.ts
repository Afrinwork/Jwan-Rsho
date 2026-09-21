import { buildCustomerUpdateData, CustomerWrite } from "@/src/repositories/customerRepositoryData";
import { buildNewCustomerForOrder, buildOrderCreateData, buildOrderItemData, CreateOrderInput } from "@/src/repositories/orderRepositoryData";
import { toCamelCase, toJson, toSnakeCase } from "@/src/repositories/supabase/caseMapping";
import { cityRepository } from "@/src/repositories/supabase/cityRepository";
import { driverStatsRepository } from "@/src/repositories/supabase/driverStatsRepository";
import { requireSupabase, resolveOwnerScope } from "@/src/repositories/supabase/repositoryContext";
import { dailyCompletionTracker } from "@/src/services/supabase/dailyCompletionTracker";
import { Order } from "@/src/types/order";
import { OrderItem } from "@/src/types/orderItem";
import { getLocalDayIsoRange } from "@/src/utils/time/localDay";
import { generateUuid } from "@/src/utils/uuid";

function withCreateTimestamps<T extends object>(value: T) {
  const timestamp = new Date().toISOString();
  return { ...value, createdAt: timestamp, updatedAt: timestamp };
}

function sortOrdersByDateDesc(orders: Order[], field: "orderedAt" | "completedAt" = "orderedAt") {
  return [...orders].sort((left, right) => (right[field] ?? "").localeCompare(left[field] ?? ""));
}

export const orderRepository = {
  // No network call, same as the Firestore version -- just mints two
  // random ids client-side so useAddOrder can reuse the same pair across
  // a double-tap or a retry-after-error.
  createDraftIds() {
    return { orderId: generateUuid(), customerId: generateUuid() };
  },

  // Runs as one atomic call (see create_order_atomic in
  // supabase/migrations) instead of a Firestore runTransaction --
  // idempotency (existingOrder check), the optional new-customer insert,
  // the order insert, and every item insert either all happen or none do.
  async createOrder(input: CreateOrderInput & { customer?: CustomerWrite; id?: string; newCustomerId?: string; requestId?: string }) {
    const { ownerId } = resolveOwnerScope();
    const customerId = input.customerId ?? input.newCustomerId ?? generateUuid();
    const orderId = input.id ?? generateUuid();

    const newCustomerPayload = input.customer
      ? { ...toSnakeCase(withCreateTimestamps(buildNewCustomerForOrder(input.customer, ownerId))), id: customerId }
      : null;

    const orderPayload = {
      ...toSnakeCase(withCreateTimestamps(buildOrderCreateData(input, ownerId, customerId, undefined, input.requestId))),
      id: orderId,
    };

    const itemsPayload = input.items.map((item, index) =>
      toSnakeCase({
        ...buildOrderItemData({ ...item, sortOrder: item.sortOrder ?? index }, generateUuid(), ownerId),
        orderId,
      }),
    );

    const { error } = await requireSupabase().rpc("create_order_atomic", {
      p_order_id: orderId,
      p_customer_id: customerId,
      p_new_customer: toJson(newCustomerPayload),
      p_order: toJson(orderPayload),
      p_items: toJson(itemsPayload),
    });

    if (error) {
      if (error.message === "order-already-exists") throw new Error("Order already exists.");
      if (error.message === "customer-not-found") throw new Error("Customer not found.");
      throw error;
    }

    if (input.customer?.city) {
      await cityRepository.ensureCityExists(input.customer.city).catch(() => undefined);
    }

    return { customerId, orderId };
  },

  async getOrderById(id: string) {
    return getOwnedOrder(id);
  },

  async getOrdersByCustomer(customerId: string) {
    return getOrdersByCustomer(customerId);
  },

  async getOpenOrders() {
    const { ownerId, driverId } = resolveOwnerScope();
    let queryBuilder = requireSupabase().from("orders").select("*").eq("owner_id", ownerId).eq("status", "open");
    if (driverId) queryBuilder = queryBuilder.eq("assigned_driver_id", driverId);

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return sortOrdersByDateDesc((data ?? []).map((row) => toCamelCase<Order>(row)));
  },

  // Live view of the same scope as getOpenOrders() -- refetches on every
  // change (a new order assigned, one completed elsewhere, ...) instead
  // of hand-reconciling incremental payloads.
  subscribeToOpenOrders(onChange: (orders: Order[]) => void, onError: (error: unknown) => void) {
    const client = requireSupabase();
    const { ownerId } = resolveOwnerScope();

    const fetchAndEmit = async () => {
      try {
        onChange(await orderRepository.getOpenOrders());
      } catch (error) {
        onError(error);
      }
    };

    void fetchAndEmit();

    // The topic must be unique per subscription instance, not just per
    // owner: if two callers (e.g. the map screen kept alive in the
    // background by react-native-screens' freeze-on-blur, and the route
    // screen navigated to on top of it) subscribe with the same topic
    // string, supabase-js returns the SAME already-subscribed channel
    // object for the second call instead of a fresh one -- chaining
    // .on(...) onto an already-subscribed channel throws.
    const channel = client
      .channel(`orders_open:${ownerId}:${generateUuid()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `owner_id=eq.${ownerId}` }, () => void fetchAndEmit())
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  },

  async getOpenOrdersByCustomerIds(customerIds: string[]) {
    return getOpenOrdersByCustomerIds(customerIds);
  },

  async getOrders() {
    const { ownerId, driverId } = resolveOwnerScope();
    let queryBuilder = requireSupabase().from("orders").select("*").eq("owner_id", ownerId);
    if (driverId) queryBuilder = queryBuilder.eq("assigned_driver_id", driverId);

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return sortOrdersByDateDesc((data ?? []).map((row) => toCamelCase<Order>(row)));
  },

  // Completing an order marks it "completed" with a completedAt
  // timestamp instead of deleting it, so it stays in the order history.
  async completeOrder(id: string) {
    const order = await getOwnedOrder(id);
    const timestamp = new Date().toISOString();
    const { error } = await requireSupabase()
      .from("orders")
      .update({ status: "completed", completed_at: timestamp, updated_at: timestamp })
      .eq("id", id);
    if (error) throw error;

    await dailyCompletionTracker.recordCompletion();
    // Best-effort: the driver dashboard's live count is a nice-to-have,
    // not something that should ever block the order actually completing.
    if (order.assignedDriverId) {
      await driverStatsRepository.recordCompletion(order.assignedDriverId).catch(() => undefined);
    }
  },

  // Live view of today's completed orders (local calendar day), for the
  // Overview "Heute erledigt" section.
  subscribeToCompletedOrdersToday(onChange: (orders: Order[]) => void, onError: (error: unknown) => void) {
    const client = requireSupabase();
    const { ownerId } = resolveOwnerScope();

    const fetchAndEmit = async () => {
      try {
        const { ownerId: scopedOwnerId, driverId } = resolveOwnerScope();
        const { startIso, endIsoExclusive } = getLocalDayIsoRange();
        let queryBuilder = requireSupabase()
          .from("orders")
          .select("*")
          .eq("owner_id", scopedOwnerId)
          .eq("status", "completed")
          .gte("completed_at", startIso)
          .lt("completed_at", endIsoExclusive);
        if (driverId) queryBuilder = queryBuilder.eq("assigned_driver_id", driverId);

        const { data, error } = await queryBuilder;
        if (error) throw error;
        onChange(sortOrdersByDateDesc((data ?? []).map((row) => toCamelCase<Order>(row)), "completedAt"));
      } catch (error) {
        onError(error);
      }
    };

    void fetchAndEmit();

    // Unique per subscription instance -- see subscribeToOpenOrders above
    // for why a topic shared across concurrent callers breaks.
    const channel = client
      .channel(`orders_completed_today:${ownerId}:${generateUuid()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `owner_id=eq.${ownerId}` }, () => void fetchAndEmit())
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  },

  // Deletes a single completed order (and its items, via ON DELETE
  // CASCADE) from the history. Guarded to completed orders only.
  async deleteCompletedOrder(id: string) {
    const order = await getOwnedOrder(id);
    if (order.status !== "completed") throw new Error("Completed order not found.");
    await deleteOrderById(id);
  },

  // Runs as one atomic call (see update_open_order_customer_and_items in
  // supabase/migrations) -- the customer update, the order's
  // assignedDriverId mirror, and the full items replace all happen in
  // one transaction, matching the Firestore writeBatch's guarantee.
  async updateOpenOrderCustomerAndItems(input: {
    customerId: string;
    orderId: string;
    customer: Partial<CustomerWrite>;
    items: (Partial<OrderItem> & Pick<OrderItem, "productId" | "productNameSnapshot" | "quantity" | "unit">)[];
  }) {
    const { ownerId } = resolveOwnerScope();
    const order = await getOwnedOrder(input.orderId);
    if (order.status !== "open" || order.customerId !== input.customerId) {
      throw new Error("Open order not found.");
    }

    const customerPatch = toSnakeCase(buildCustomerUpdateData(input.customer));
    const orderPatch = input.customer.assignedDriverId !== undefined ? { assigned_driver_id: input.customer.assignedDriverId } : {};
    const itemsPayload = input.items.map((item, index) =>
      toSnakeCase({
        ...buildOrderItemData({ ...item, sortOrder: item.sortOrder ?? index }, generateUuid(), ownerId),
        orderId: input.orderId,
      }),
    );

    const { error } = await requireSupabase().rpc("update_open_order_customer_and_items", {
      p_order_id: input.orderId,
      p_customer_id: input.customerId,
      p_customer_patch: toJson(customerPatch),
      p_order_patch: toJson(orderPatch),
      p_items: toJson(itemsPayload),
    });
    if (error) throw error;

    if (input.customer.city) {
      await cityRepository.ensureCityExists(input.customer.city).catch(() => undefined);
    }
  },

  async cancelOrder(id: string) {
    await getOwnedOrder(id);
    const { error } = await requireSupabase()
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  // Permanently deletes a single order and its items (ON DELETE CASCADE
  // handles the items), regardless of status.
  async deleteOrder(id: string) {
    await deleteOrderById(id);
  },

  async countOpenOrdersByOwner(ownerId: string) {
    const { count, error } = await requireSupabase()
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .eq("status", "open");
    if (error) throw error;
    return count ?? 0;
  },

  async countOrdersByOwner(ownerId: string) {
    const { count, error } = await requireSupabase()
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", ownerId);
    if (error) throw error;
    return count ?? 0;
  },

  // Every order item across every order, for the read-only
  // data-integrity diagnostic. A plain owner-scoped query through the
  // orders join now that order_items has a real FK to orders -- no more
  // separate collectionGroup-style rule needed the way Firestore
  // required for a cross-order query (see schema notes in
  // supabase/migrations for why order_items dropped its own owner_id).
  async getAllItemsForOwnerDiagnostics() {
    const { ownerId } = resolveOwnerScope();
    const { data, error } = await requireSupabase()
      .from("order_items")
      .select("*, orders!inner(owner_id)")
      .eq("orders.owner_id", ownerId);
    if (error) throw error;
    return (data ?? []).map((row) => {
      const { orders: _orders, ...item } = row as typeof row & { orders: unknown };
      return { ...toCamelCase<Record<string, unknown>>(item), orderId: item.order_id };
    });
  },
};

async function deleteOrderById(id: string) {
  await getOwnedOrder(id);
  const { error } = await requireSupabase().from("orders").delete().eq("id", id);
  if (error) throw error;
}

export async function getOwnedOrder(id: string): Promise<Order> {
  const { data, error } = await requireSupabase().from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Order not found.");
  return toCamelCase<Order>(data);
}

export async function getOrdersByCustomer(customerId: string) {
  const { ownerId, driverId } = resolveOwnerScope();
  let queryBuilder = requireSupabase().from("orders").select("*").eq("owner_id", ownerId).eq("customer_id", customerId);
  if (driverId) queryBuilder = queryBuilder.eq("assigned_driver_id", driverId);

  const { data, error } = await queryBuilder;
  if (error) throw error;
  return sortOrdersByDateDesc((data ?? []).map((row) => toCamelCase<Order>(row)));
}

export async function getOpenOrdersByCustomerIds(customerIds: string[]) {
  const orders = await orderRepository.getOpenOrders();
  const customerIdSet = new Set(customerIds);
  return orders.filter((value) => customerIdSet.has(value.customerId));
}

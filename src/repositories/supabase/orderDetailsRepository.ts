import { toCamelCase } from "@/src/repositories/supabase/caseMapping";
import { getOpenOrdersByCustomerIds, getOrdersByCustomer, getOwnedOrder, orderRepository } from "@/src/repositories/supabase/orderRepository";
import { requireSupabase } from "@/src/repositories/supabase/repositoryContext";
import { Order, OrderWithItems } from "@/src/types/order";
import { OrderItem } from "@/src/types/orderItem";

export const orderDetailsRepository = {
  async getOrderItems(orderId: string) {
    await getOwnedOrder(orderId);
    const { data, error } = await requireSupabase()
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("sort_order");
    if (error) throw error;
    // order_items.quantity is a Postgres `numeric` column -- postgrest-js
    // returns those as strings (unlike `double precision`/`integer`
    // columns), so it must be coerced back to a real number here or every
    // downstream sum (product totals, share/export text) silently does
    // string concatenation instead of addition.
    return (data ?? []).map((row) => ({ ...toCamelCase<OrderItem>(row), quantity: Number(row.quantity) }));
  },

  // Batched (one items query per 100 orders) instead of an ownership check
  // plus an items query per order -- with many open orders the per-order
  // version fired hundreds of requests after every completion.
  async getOrdersWithItems(orders: Order[]) {
    return getItemsForOrders(orders);
  },

  async getOrderByIdWithItems(orderId: string): Promise<OrderWithItems> {
    const order = await getOwnedOrder(orderId);
    return { ...order, items: await this.getOrderItems(orderId) };
  },

  async getOrdersByCustomerWithItems(customerId: string) {
    return this.getOrdersWithItems(await getOrdersByCustomer(customerId));
  },

  async getOpenOrdersWithItemsByCustomerIds(customerIds: string[]) {
    return this.getOrdersWithItems(await getOpenOrdersByCustomerIds(customerIds));
  },

  // Live view for the Overview "Heute erledigt" section. Realtime
  // (postgres_changes) only gives row-level change events, not joined
  // payloads the way a Firestore listener effectively could -- so this
  // reacts to any order-level change from subscribeToCompletedOrdersToday
  // and refetches items for the affected set, same refetch-on-change
  // pattern used throughout the Supabase repositories.
  subscribeToCompletedOrdersTodayWithItems(
    onChange: (orders: OrderWithItems[]) => void,
    onError: (error: unknown) => void,
  ) {
    return orderRepository.subscribeToCompletedOrdersToday(withItemsInOrder(onChange, onError), onError);
  },

  // Same as above for the whole completed history (up to 200 orders), so
  // items are fetched in a few batched queries instead of one per order.
  subscribeToAllCompletedOrdersWithItems(
    onChange: (orders: OrderWithItems[]) => void,
    onError: (error: unknown) => void,
  ) {
    return orderRepository.subscribeToAllCompletedOrders(withItemsInOrder(onChange, onError), onError);
  },
};

// Joins items onto each emitted order list, dropping a result that finishes
// after a newer list arrived so an older snapshot never overwrites it.
function withItemsInOrder(onChange: (orders: OrderWithItems[]) => void, onError: (error: unknown) => void) {
  let latestRequestId = 0;
  return (orders: Order[]) => {
    const requestId = ++latestRequestId;
    getItemsForOrders(orders)
      .then((value) => {
        if (requestId === latestRequestId) onChange(value);
      })
      .catch((error) => {
        if (requestId === latestRequestId) onError(error);
      });
  };
}

const ITEM_BATCH_SIZE = 100;

// The orders passed in are already owner/driver scoped by the query that
// loaded them, so no per-order ownership check is needed here.
async function getItemsForOrders(orders: Order[]): Promise<OrderWithItems[]> {
  const itemsByOrderId = new Map<string, OrderItem[]>();

  for (let index = 0; index < orders.length; index += ITEM_BATCH_SIZE) {
    const ids = orders.slice(index, index + ITEM_BATCH_SIZE).map((value) => value.id);
    const { data, error } = await requireSupabase().from("order_items").select("*").in("order_id", ids).order("sort_order");
    if (error) throw error;
    for (const row of data ?? []) {
      const orderId = row.order_id as string;
      const list = itemsByOrderId.get(orderId) ?? [];
      list.push({ ...toCamelCase<OrderItem>(row), quantity: Number(row.quantity) });
      itemsByOrderId.set(orderId, list);
    }
  }

  return orders.map((value) => ({ ...value, items: itemsByOrderId.get(value.id) ?? [] }));
}

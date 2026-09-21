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

  async getOrdersWithItems(orders: Order[]) {
    return Promise.all(
      orders.map(async (value) => ({
        ...value,
        items: await this.getOrderItems(value.id),
      })),
    );
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
    return orderRepository.subscribeToCompletedOrdersToday((orders) => {
      this.getOrdersWithItems(orders).then(onChange).catch(onError);
    }, onError);
  },
};

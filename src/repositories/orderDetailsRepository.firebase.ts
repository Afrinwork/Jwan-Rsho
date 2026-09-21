import { collection, getDocs, orderBy, query } from "firebase/firestore";

import { getOwnedOrder, getOrdersByCustomer, getOpenOrdersByCustomerIds, orderRepository } from "@/src/repositories/orderRepository.firebase";
import { mapSnapshot, requireDb } from "@/src/repositories/repositoryContext.firebase";
import { Order, OrderWithItems } from "@/src/types/order";
import { OrderItem } from "@/src/types/orderItem";

export const orderDetailsRepository = {
  async getOrderItems(orderId: string) {
    await getOwnedOrder(orderId);
    const itemQuery = query(
      collection(requireDb(), "orders", orderId, "items"),
      orderBy("sortOrder"),
    );
    return (await getDocs(itemQuery)).docs.map((value) => mapSnapshot<OrderItem>(value));
  },

  async getOrdersWithItems(orders: Order[]) {
    return Promise.all(orders.map(async (value) => ({
      ...value,
      items: await this.getOrderItems(value.id),
    })));
  },

  async getOrderByIdWithItems(orderId: string) {
    const order = await getOwnedOrder(orderId);
    return {
      ...mapSnapshot<OrderWithItems>(order),
      items: await this.getOrderItems(orderId),
    };
  },

  async getOrdersByCustomerWithItems(customerId: string) {
    return this.getOrdersWithItems(await getOrdersByCustomer(customerId));
  },

  async getOpenOrdersWithItemsByCustomerIds(customerIds: string[]) {
    return this.getOrdersWithItems(await getOpenOrdersByCustomerIds(customerIds));
  },

  // Live view for the Overview "Heute erledigt" section. onChange fires with
  // freshly joined items on every underlying orders change (a completion,
  // a deletion, ...); onError forwards subscribeToCompletedOrdersToday's.
  subscribeToCompletedOrdersTodayWithItems(
    onChange: (orders: OrderWithItems[]) => void,
    onError: (error: unknown) => void,
  ) {
    return orderRepository.subscribeToCompletedOrdersToday((orders) => {
      this.getOrdersWithItems(orders).then(onChange).catch(onError);
    }, onError);
  },
};

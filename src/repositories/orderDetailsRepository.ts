import { collection, getDocs, orderBy, query } from "firebase/firestore";

import { getOwnedOrder, getOrdersByCustomer, getOpenOrdersByCustomerIds } from "@/src/repositories/orderRepository";
import { mapSnapshot, requireDb } from "@/src/repositories/repositoryContext";
import { OrderWithItems } from "@/src/types/order";
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

  async getOrderByIdWithItems(orderId: string) {
    const order = await getOwnedOrder(orderId);
    return {
      ...mapSnapshot<OrderWithItems>(order),
      items: await this.getOrderItems(orderId),
    };
  },

  async getOrdersByCustomerWithItems(customerId: string) {
    const orders = await getOrdersByCustomer(customerId);
    return Promise.all(orders.map(async (value) => ({
      ...value,
      items: await this.getOrderItems(value.id),
    })));
  },

  async getOpenOrdersWithItemsByCustomerIds(customerIds: string[]) {
    const orders = await getOpenOrdersByCustomerIds(customerIds);
    return Promise.all(orders.map(async (value) => ({
      ...value,
      items: await this.getOrderItems(value.id),
    })));
  },
};

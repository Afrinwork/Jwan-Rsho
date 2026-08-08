import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";

import { CustomerWrite } from "@/src/repositories/customerRepositoryData";
import { buildNewCustomerForOrder, buildOrderCreateData, buildOrderItemData, CreateOrderInput } from "@/src/repositories/orderRepositoryData";
import { mapSnapshot, requireCurrentUserId, requireDb } from "@/src/repositories/repositoryContext";
import { Order } from "@/src/types/order";

export const orderRepository = {
  async createOrder(input: CreateOrderInput & { customer?: CustomerWrite; id?: string }) {
    const db = requireDb();
    const ownerId = requireCurrentUserId();

    return runTransaction(db, async (transaction) => {
      const customerId = input.customerId ?? doc(collection(db, "customers")).id;
      const orderId = input.id ?? doc(collection(db, "orders")).id;
      const orderRef = doc(db, "orders", orderId);
      const customerRef = doc(db, "customers", customerId);
      const existingOrder = await transaction.get(orderRef);

      if (existingOrder.exists()) {
        throw new Error("Order already exists.");
      }

      if (input.customer) {
        transaction.set(customerRef, withCreateTimestamps(buildNewCustomerForOrder(input.customer, ownerId)));
      } else {
        const customerSnapshot = await transaction.get(customerRef);
        if (!customerSnapshot.exists() || customerSnapshot.data().ownerId !== ownerId) {
          throw new Error("Customer not found.");
        }
      }

      transaction.set(orderRef, withCreateTimestamps(buildOrderCreateData(input, ownerId, customerId)));
      input.items.forEach((item, index) => {
        const itemRef = doc(collection(orderRef, "items"));
        transaction.set(itemRef, buildOrderItemData({ ...item, sortOrder: item.sortOrder ?? index }, itemRef.id));
      });

      return { customerId, orderId };
    });
  },

  async getOrderById(id: string) {
    const snapshot = await getOwnedOrder(id);
    return mapSnapshot<Order>(snapshot);
  },

  async getOrdersByCustomer(customerId: string) {
    return getOrdersByCustomer(customerId);
  },

  async getOpenOrders() {
    const ownerId = requireCurrentUserId();
    const orderQuery = query(collection(requireDb(), "orders"), where("ownerId", "==", ownerId), where("status", "==", "open"), orderBy("orderedAt", "desc"));
    return (await getDocs(orderQuery)).docs.map((value) => mapSnapshot<Order>(value));
  },

  async getOpenOrdersByCustomerIds(customerIds: string[]) {
    return getOpenOrdersByCustomerIds(customerIds);
  },

  async getOrders() {
    const ownerId = requireCurrentUserId();
    const orderQuery = query(
      collection(requireDb(), "orders"),
      where("ownerId", "==", ownerId),
      orderBy("orderedAt", "desc"),
    );
    return (await getDocs(orderQuery)).docs.map((value) => mapSnapshot<Order>(value));
  },

  async completeOrder(id: string) {
    const snapshot = await getOwnedOrder(id);
    await updateDoc(snapshot.ref, { status: "completed", completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  },

  async cancelOrder(id: string) {
    const snapshot = await getOwnedOrder(id);
    await updateDoc(snapshot.ref, { status: "cancelled", updatedAt: new Date().toISOString() });
  },

  async countOpenOrdersByOwner(ownerId: string) {
    const orderQuery = query(collection(requireDb(), "orders"), where("ownerId", "==", ownerId), where("status", "==", "open"));
    return (await getCountFromServer(orderQuery)).data().count;
  },

  async countOrdersByOwner(ownerId: string) {
    const orderQuery = query(collection(requireDb(), "orders"), where("ownerId", "==", ownerId));
    return (await getCountFromServer(orderQuery)).data().count;
  },
};

export async function getOwnedOrder(id: string) {
  const ownerId = requireCurrentUserId();
  const snapshot = await getDoc(doc(requireDb(), "orders", id));

  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("Order not found.");
  }

  return snapshot;
}

export async function getOrdersByCustomer(customerId: string) {
  const ownerId = requireCurrentUserId();
  const orderQuery = query(
    collection(requireDb(), "orders"),
    where("ownerId", "==", ownerId),
    where("customerId", "==", customerId),
    orderBy("orderedAt", "desc"),
  );
  return (await getDocs(orderQuery)).docs.map((value) => mapSnapshot<Order>(value));
}

export async function getOpenOrdersByCustomerIds(customerIds: string[]) {
  const orders = await orderRepository.getOpenOrders();
  const customerIdSet = new Set(customerIds);
  return orders.filter((value) => customerIdSet.has(value.customerId));
}

function withCreateTimestamps<T extends object>(value: T) {
  const timestamp = new Date().toISOString();
  return { ...value, createdAt: timestamp, updatedAt: timestamp };
}

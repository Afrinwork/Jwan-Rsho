import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  writeBatch,
  where,
} from "firebase/firestore";

import { buildCustomerUpdateData, CustomerWrite } from "@/src/repositories/customerRepositoryData";
import { buildNewCustomerForOrder, buildOrderCreateData, buildOrderItemData, CreateOrderInput } from "@/src/repositories/orderRepositoryData";
import { cityRepository } from "@/src/repositories/cityRepository";
import { mapSnapshot, requireCurrentUserId, requireDb } from "@/src/repositories/repositoryContext";
import { dailyCompletionTracker } from "@/src/services/dailyCompletionTracker";
import { Order } from "@/src/types/order";
import { OrderItem } from "@/src/types/orderItem";

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
        transaction.set(itemRef, buildOrderItemData({ ...item, sortOrder: item.sortOrder ?? index }, itemRef.id, ownerId));
      });

      return { customerId, orderId };
    }).then(async (result) => {
      if (input.customer?.city) {
        await cityRepository.ensureCityExists(input.customer.city).catch(() => undefined);
      }
      return result;
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
    const orderQuery = query(collection(requireDb(), "orders"), where("ownerId", "==", ownerId), where("status", "==", "open"));
    return sortOrdersByDateDesc((await getDocs(orderQuery)).docs.map((value) => mapSnapshot<Order>(value)));
  },

  async getOpenOrdersByCustomerIds(customerIds: string[]) {
    return getOpenOrdersByCustomerIds(customerIds);
  },

  async getOrders() {
    const ownerId = requireCurrentUserId();
    const orderQuery = query(collection(requireDb(), "orders"), where("ownerId", "==", ownerId));
    return sortOrdersByDateDesc((await getDocs(orderQuery)).docs.map((value) => mapSnapshot<Order>(value)));
  },

  // Completing an order deletes it outright (order + items) rather than just
  // marking it "completed" — the app keeps no history of finished orders, by
  // design, so it always stays clean without needing any retention window.
  async completeOrder(id: string) {
    await deleteOrderById(id);
    await dailyCompletionTracker.recordCompletion();
  },

  async updateOpenOrderCustomerAndItems(input: {
    customerId: string;
    orderId: string;
    customer: Partial<CustomerWrite>;
    items: (Partial<OrderItem> & Pick<OrderItem, "productId" | "productNameSnapshot" | "quantity" | "unit">)[];
  }) {
    const ownerId = requireCurrentUserId();
    const customerSnapshot = await getOwnedCustomer(input.customerId);
    const orderSnapshot = await getOwnedOrder(input.orderId);

    if (orderSnapshot.data().status !== "open" || orderSnapshot.data().customerId !== input.customerId) {
      throw new Error("Open order not found.");
    }

    const db = requireDb();
    const batch = writeBatch(db);
    const orderItemsCollection = collection(db, "orders", input.orderId, "items");
    const existingItemSnapshots = await getDocs(orderItemsCollection);
    const timestamp = new Date().toISOString();

    batch.update(customerSnapshot.ref, {
      ...clean(buildCustomerUpdateData(input.customer)),
      updatedAt: timestamp,
    });
    batch.update(orderSnapshot.ref, {
      updatedAt: timestamp,
    });

    existingItemSnapshots.docs.forEach((value) => batch.delete(value.ref));
    input.items.forEach((item, index) => {
      const itemRef = doc(orderItemsCollection);
      batch.set(itemRef, buildOrderItemData({ ...item, sortOrder: item.sortOrder ?? index }, itemRef.id, ownerId));
    });

    await batch.commit();

    if (input.customer.city) {
      await cityRepository.ensureCityExists(input.customer.city).catch(() => undefined);
    }
  },

  async cancelOrder(id: string) {
    const snapshot = await getOwnedOrder(id);
    await updateDoc(snapshot.ref, { status: "cancelled", updatedAt: new Date().toISOString() });
  },

  // Permanently deletes a single order and its items, regardless of status.
  async deleteOrder(id: string) {
    await deleteOrderById(id);
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

async function deleteOrderById(id: string) {
  const snapshot = await getOwnedOrder(id);
  const db = requireDb();
  const itemsSnapshot = await getDocs(collection(db, "orders", id, "items"));
  const batch = writeBatch(db);
  itemsSnapshot.docs.forEach((item) => batch.delete(item.ref));
  batch.delete(snapshot.ref);
  await batch.commit();
}

export async function getOwnedOrder(id: string) {
  const ownerId = requireCurrentUserId();
  const snapshot = await getDoc(doc(requireDb(), "orders", id));

  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("Order not found.");
  }

  return snapshot;
}

async function getOwnedCustomer(id: string) {
  const ownerId = requireCurrentUserId();
  const snapshot = await getDoc(doc(requireDb(), "customers", id));

  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("Customer not found.");
  }

  return snapshot;
}

export async function getOrdersByCustomer(customerId: string) {
  const ownerId = requireCurrentUserId();
  const orderQuery = query(
    collection(requireDb(), "orders"),
    where("ownerId", "==", ownerId),
    where("customerId", "==", customerId),
  );
  return sortOrdersByDateDesc((await getDocs(orderQuery)).docs.map((value) => mapSnapshot<Order>(value)));
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

function clean<T extends object>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, current]) => current !== undefined)) as T;
}

function sortOrdersByDateDesc(orders: Order[]) {
  return [...orders].sort((left, right) => right.orderedAt.localeCompare(left.orderedAt));
}

import {
  collection,
  collectionGroup,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  writeBatch,
  where,
} from "firebase/firestore";

import { buildCustomerUpdateData, CustomerWrite } from "@/src/repositories/customerRepositoryData";
import { buildNewCustomerForOrder, buildOrderCreateData, buildOrderItemData, CreateOrderInput } from "@/src/repositories/orderRepositoryData";
import { cityRepository } from "@/src/repositories/cityRepository.firebase";
import { driverStatsRepository } from "@/src/repositories/driverStatsRepository.firebase";
import { mapSnapshot, requireDb, resolveOwnerScope } from "@/src/repositories/repositoryContext.firebase";
import { dailyCompletionTracker } from "@/src/services/dailyCompletionTracker";
import { Order } from "@/src/types/order";
import { OrderItem } from "@/src/types/orderItem";
import { getLocalDayIsoRange } from "@/src/utils/time/localDay";

export const orderRepository = {
  // Client-side id generation only (doc() with no path segment never hits the
  // network) — lets a caller (useAddOrder) mint a stable {orderId,
  // customerId} pair ONCE per save attempt and reuse it across a double-tap
  // or a retry-after-error, so createOrder()'s own existingOrder.exists()
  // check below can catch the duplicate instead of creating two orders.
  createDraftIds() {
    const db = requireDb();
    return {
      orderId: doc(collection(db, "orders")).id,
      customerId: doc(collection(db, "customers")).id,
    };
  },

  async createOrder(input: CreateOrderInput & { customer?: CustomerWrite; id?: string; newCustomerId?: string; requestId?: string }) {
    const db = requireDb();
    const { ownerId } = resolveOwnerScope();

    return runTransaction(db, async (transaction) => {
      // input.customerId (schema-validated) names an EXISTING customer;
      // input.newCustomerId (not part of the schema, same convention as
      // input.id below) is the caller's pre-assigned id for a brand new one —
      // kept as a separate field so the two can never collide with the
      // createOrderInputSchema refine() that requires exactly one of
      // customerId/customer.
      const customerId = input.customerId ?? input.newCustomerId ?? doc(collection(db, "customers")).id;
      const orderId = input.id ?? doc(collection(db, "orders")).id;
      const orderRef = doc(db, "orders", orderId);
      const customerRef = doc(db, "customers", customerId);
      const existingOrder = await transaction.get(orderRef);

      if (existingOrder.exists()) {
        throw new Error("Order already exists.");
      }

      let assignedDriverId: string | undefined;

      if (input.customer) {
        const customerData = withCreateTimestamps(buildNewCustomerForOrder(input.customer, ownerId));
        transaction.set(customerRef, customerData);
        assignedDriverId = customerData.assignedDriverId;
      } else {
        const customerSnapshot = await transaction.get(customerRef);
        if (!customerSnapshot.exists() || customerSnapshot.data().ownerId !== ownerId) {
          throw new Error("Customer not found.");
        }
        assignedDriverId = customerSnapshot.data().assignedDriverId;
      }

      transaction.set(orderRef, withCreateTimestamps(buildOrderCreateData(input, ownerId, customerId, assignedDriverId, input.requestId)));
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
    const orderQuery = buildOpenOrdersQuery();
    return sortOrdersByDateDesc((await getDocs(orderQuery)).docs.map((value) => mapSnapshot<Order>(value)));
  },

  // Live view of the same scope as getOpenOrders() — fires immediately with
  // the current matching orders, then again on every change (a new order
  // assigned to a driver, one completed elsewhere, ...), so a driver's map
  // stays current without them needing to pull-to-refresh or leave and
  // reopen the screen. Returns the unsubscribe function.
  subscribeToOpenOrders(onChange: (orders: Order[]) => void, onError: (error: unknown) => void) {
    const orderQuery = buildOpenOrdersQuery();
    return onSnapshot(
      orderQuery,
      (snapshot) => onChange(sortOrdersByDateDesc(snapshot.docs.map((value) => mapSnapshot<Order>(value)))),
      onError,
    );
  },

  async getOpenOrdersByCustomerIds(customerIds: string[]) {
    return getOpenOrdersByCustomerIds(customerIds);
  },

  async getOrders() {
    const { ownerId, driverId } = resolveOwnerScope();
    const orderQuery = driverId
      ? query(collection(requireDb(), "orders"), where("ownerId", "==", ownerId), where("assignedDriverId", "==", driverId))
      : query(collection(requireDb(), "orders"), where("ownerId", "==", ownerId));
    return sortOrdersByDateDesc((await getDocs(orderQuery)).docs.map((value) => mapSnapshot<Order>(value)));
  },

  // Completing an order marks it "completed" with a completedAt timestamp
  // instead of deleting it, so it stays in the order history (and shows up
  // in "Heute erledigt") — the customer, address and item lines are untouched.
  async completeOrder(id: string) {
    const snapshot = await getOwnedOrder(id);
    const assignedDriverId = snapshot.data().assignedDriverId as string | undefined;
    const timestamp = new Date().toISOString();
    await updateDoc(snapshot.ref, { status: "completed", completedAt: timestamp, updatedAt: timestamp });
    await dailyCompletionTracker.recordCompletion();
    // Best-effort: the driver dashboard's live count is a nice-to-have, not
    // something that should ever block the order actually completing.
    if (assignedDriverId) {
      await driverStatsRepository.recordCompletion(assignedDriverId).catch(() => undefined);
    }
  },

  // Live view of today's completed orders (local calendar day), for the
  // Overview "Heute erledigt" section — fires immediately, then again on
  // every completion/deletion, so it stays current across screens without a
  // manual refresh. Returns the unsubscribe function.
  subscribeToCompletedOrdersToday(onChange: (orders: Order[]) => void, onError: (error: unknown) => void) {
    const orderQuery = buildCompletedTodayOrdersQuery();
    return onSnapshot(
      orderQuery,
      (snapshot) => onChange(sortOrdersByDateDesc(snapshot.docs.map((value) => mapSnapshot<Order>(value)), "completedAt")),
      onError,
    );
  },

  // Deletes a single completed order (and its items) from the history, e.g.
  // from the Overview "Heute erledigt" list. Guarded to completed orders only
  // so this action can never remove an open order.
  async deleteCompletedOrder(id: string) {
    const snapshot = await getOwnedOrder(id);

    if (snapshot.data().status !== "completed") {
      throw new Error("Completed order not found.");
    }

    await deleteOrderById(id);
  },

  async updateOpenOrderCustomerAndItems(input: {
    customerId: string;
    orderId: string;
    customer: Partial<CustomerWrite>;
    items: (Partial<OrderItem> & Pick<OrderItem, "productId" | "productNameSnapshot" | "quantity" | "unit">)[];
  }) {
    const { ownerId } = resolveOwnerScope();
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
      ...(input.customer.assignedDriverId !== undefined ? { assignedDriverId: input.customer.assignedDriverId } : {}),
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

  // Every order item across every order, for the read-only data-integrity
  // diagnostic — a collectionGroup query so it doesn't need to first fetch
  // every order and then every items subcollection one by one. Authorized by
  // a dedicated collectionGroup security rule that checks the item's OWN
  // ownerId field (see firestore.rules' `match /{path=**}/items/{itemId}`)
  // rather than get()-ing the parent order, so an orphaned item (parent
  // order already deleted) reads back normally instead of tripping a rule
  // evaluation error — exactly the case this diagnostic exists to find.
  // Returns raw Firestore data (id/orderId plus whatever fields the document
  // actually has) rather than the strict `OrderItem` type: the diagnostic's
  // job is to find documents that DON'T match what the app normally writes
  // (a wrong type, a missing field), so trusting the strict type here would
  // hide exactly the cases it needs to catch. getAllItemsForOwnerDiagnostics
  // can still fail for ordinary reasons (offline, a transient error) — the
  // diagnostic hook still catches that and reports a degraded items scan
  // rather than letting it look like the whole diagnostic crashed.
  async getAllItemsForOwnerDiagnostics() {
    const { ownerId } = resolveOwnerScope();
    const itemsQuery = query(collectionGroup(requireDb(), "items"), where("ownerId", "==", ownerId));
    return (await getDocs(itemsQuery)).docs.map((value) => ({
      id: value.id,
      orderId: value.ref.parent.parent?.id,
      ...value.data(),
    }));
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
  const { ownerId } = resolveOwnerScope();
  const snapshot = await getDoc(doc(requireDb(), "orders", id));

  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("Order not found.");
  }

  return snapshot;
}

async function getOwnedCustomer(id: string) {
  const { ownerId } = resolveOwnerScope();
  const snapshot = await getDoc(doc(requireDb(), "customers", id));

  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("Customer not found.");
  }

  return snapshot;
}

export async function getOrdersByCustomer(customerId: string) {
  const { ownerId, driverId } = resolveOwnerScope();
  const orderQuery = driverId
    ? query(
        collection(requireDb(), "orders"),
        where("ownerId", "==", ownerId),
        where("assignedDriverId", "==", driverId),
        where("customerId", "==", customerId),
      )
    : query(
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

function buildOpenOrdersQuery() {
  const { ownerId, driverId } = resolveOwnerScope();
  return driverId
    ? query(
        collection(requireDb(), "orders"),
        where("ownerId", "==", ownerId),
        where("assignedDriverId", "==", driverId),
        where("status", "==", "open"),
      )
    : query(collection(requireDb(), "orders"), where("ownerId", "==", ownerId), where("status", "==", "open"));
}

function buildCompletedTodayOrdersQuery() {
  const { ownerId, driverId } = resolveOwnerScope();
  const { startIso, endIsoExclusive } = getLocalDayIsoRange();
  const filters = [
    where("ownerId", "==", ownerId),
    ...(driverId ? [where("assignedDriverId", "==", driverId)] : []),
    where("status", "==", "completed"),
    where("completedAt", ">=", startIso),
    where("completedAt", "<", endIsoExclusive),
  ];
  return query(collection(requireDb(), "orders"), ...filters);
}

function sortOrdersByDateDesc(orders: Order[], field: "orderedAt" | "completedAt" = "orderedAt") {
  return [...orders].sort((left, right) => (right[field] ?? "").localeCompare(left[field] ?? ""));
}

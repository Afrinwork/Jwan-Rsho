import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { buildCustomerCreateData, buildCustomerUpdateData, CustomerWrite } from "@/src/repositories/customerRepositoryData";
import { cityRepository } from "@/src/repositories/cityRepository";
import { mapSnapshot, requireCurrentUserId, requireDb } from "@/src/repositories/repositoryContext";
import { Customer } from "@/src/types/customer";

export const customerRepository = {
  async createCustomer(input: CustomerWrite) {
    const ownerId = requireCurrentUserId();
    const customerRef = doc(collection(requireDb(), "customers"));
    await setDoc(customerRef, withCreateTimestamps(buildCustomerCreateData(input, ownerId)));
    await cityRepository.ensureCityExists(input.city).catch(() => undefined);
    return customerRef.id;
  },

  async updateCustomer(id: string, input: Partial<CustomerWrite>) {
    const snapshot = await getOwnedCustomer(id);
    await updateDoc(snapshot.ref, { ...clean(buildCustomerUpdateData(input)), updatedAt: new Date().toISOString() });

    if (input.city) {
      await cityRepository.ensureCityExists(input.city).catch(() => undefined);
    }
  },

  // Deleting a customer also deletes all of their orders (+ items), so no
  // orphaned orders are left pointing at a customer that no longer exists.
  async deleteCustomer(id: string) {
    const snapshot = await getOwnedCustomer(id);
    const db = requireDb();
    const ownerId = requireCurrentUserId();
    const ordersQuery = query(collection(db, "orders"), where("ownerId", "==", ownerId), where("customerId", "==", id));
    const ordersSnapshot = await getDocs(ordersQuery);

    await Promise.all(
      ordersSnapshot.docs.map(async (orderDoc) => {
        const itemsSnapshot = await getDocs(collection(orderDoc.ref, "items"));
        await Promise.all(itemsSnapshot.docs.map((item) => deleteDoc(item.ref)));
        await deleteDoc(orderDoc.ref);
      }),
    );

    await deleteDoc(snapshot.ref);
  },

  async getCustomerById(id: string) {
    const snapshot = await getOwnedCustomer(id);
    return mapSnapshot<Customer>(snapshot);
  },

  async getCustomers() {
    const ownerId = requireCurrentUserId();
    const customerQuery = query(collection(requireDb(), "customers"), where("ownerId", "==", ownerId));
    return sortCustomers((await getDocs(customerQuery)).docs.map((value) => mapSnapshot<Customer>(value)));
  },

  // Fetches only the given customer docs, batched to respect Firestore's
  // 30-value "in" limit — used instead of getCustomers() wherever only a
  // known subset (e.g. customers with an open order) is actually needed.
  async getCustomersByIds(ids: string[]) {
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length === 0) {
      return [];
    }

    const ownerId = requireCurrentUserId();
    const db = requireDb();
    const chunks = chunk(uniqueIds, 30);
    const results = await Promise.all(
      chunks.map(async (idChunk) => {
        const customerQuery = query(
          collection(db, "customers"),
          where("ownerId", "==", ownerId),
          where(documentId(), "in", idChunk),
        );
        return (await getDocs(customerQuery)).docs.map((value) => mapSnapshot<Customer>(value));
      }),
    );

    return sortCustomers(results.flat());
  },

  async getCustomersByNormalizedCity(normalizedCity: string) {
    const ownerId = requireCurrentUserId();
    const customerQuery = query(
      collection(requireDb(), "customers"),
      where("ownerId", "==", ownerId),
      where("normalizedCity", "==", normalizedCity),
    );
    return sortCustomers((await getDocs(customerQuery)).docs.map((value) => mapSnapshot<Customer>(value)));
  },

  async searchCustomers(searchTerm: string) {
    const term = searchTerm.trim().toLowerCase();
    const customers = await this.getCustomers();
    return customers.filter((value) => [value.fullName, value.phone, value.city, value.address].some((field) => field.toLowerCase().includes(term)));
  },

  async countCustomersByOwner(ownerId: string) {
    const customerQuery = query(collection(requireDb(), "customers"), where("ownerId", "==", ownerId));
    return (await getCountFromServer(customerQuery)).data().count;
  },
};

async function getOwnedCustomer(id: string) {
  const ownerId = requireCurrentUserId();
  const snapshot = await getDoc(doc(requireDb(), "customers", id));

  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("Customer not found.");
  }

  return snapshot;
}

function clean<T extends object>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, current]) => current !== undefined)) as T;
}

function withCreateTimestamps<T extends object>(value: T) {
  const timestamp = new Date().toISOString();
  return { ...value, createdAt: timestamp, updatedAt: timestamp };
}

function sortCustomers(customers: Customer[]) {
  return [...customers].sort((left, right) => left.fullName.localeCompare(right.fullName, "de"));
}

function chunk<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { buildCustomerCreateData, buildCustomerUpdateData, CustomerWrite } from "@/src/repositories/customerRepositoryData";
import { mapSnapshot, requireCurrentUserId, requireDb } from "@/src/repositories/repositoryContext";
import { Customer } from "@/src/types/customer";

export const customerRepository = {
  async createCustomer(input: CustomerWrite) {
    const ownerId = requireCurrentUserId();
    const customerRef = doc(collection(requireDb(), "customers"));
    await setDoc(customerRef, withCreateTimestamps(buildCustomerCreateData(input, ownerId)));
    return customerRef.id;
  },

  async updateCustomer(id: string, input: Partial<CustomerWrite>) {
    const snapshot = await getOwnedCustomer(id);
    await updateDoc(snapshot.ref, { ...clean(buildCustomerUpdateData(input)), updatedAt: new Date().toISOString() });
  },

  async deleteCustomer(id: string) {
    const snapshot = await getOwnedCustomer(id);
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

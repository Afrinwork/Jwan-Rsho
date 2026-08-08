import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { buildProductCreateData, buildProductUpdateData, ProductWrite } from "@/src/repositories/productRepositoryData";
import { mapSnapshot, requireCurrentUserId, requireDb } from "@/src/repositories/repositoryContext";
import { Product } from "@/src/types/product";

export const productRepository = {
  async createProduct(input: ProductWrite) {
    const ownerId = requireCurrentUserId();
    const productRef = doc(collection(requireDb(), "products"));
    await setDoc(productRef, withCreateTimestamps(buildProductCreateData(input, ownerId)));
    return productRef.id;
  },

  async updateProduct(id: string, input: Partial<ProductWrite>) {
    const snapshot = await getOwnedProduct(id);
    await updateDoc(snapshot.ref, { ...clean(buildProductUpdateData(input)), updatedAt: new Date().toISOString() });
  },

  async deactivateProduct(id: string) {
    const snapshot = await getOwnedProduct(id);
    await updateDoc(snapshot.ref, { isActive: false, updatedAt: new Date().toISOString() });
  },

  async deleteProduct(id: string) {
    const snapshot = await getOwnedProduct(id);
    await deleteDoc(snapshot.ref);
  },

  async getProducts() {
    const ownerId = requireCurrentUserId();
    const productQuery = query(collection(requireDb(), "products"), where("ownerId", "==", ownerId), orderBy("sortOrder"), orderBy("name"));
    return (await getDocs(productQuery)).docs.map((value) => mapSnapshot<Product>(value));
  },
};

async function getOwnedProduct(id: string) {
  const ownerId = requireCurrentUserId();
  const snapshot = await getDoc(doc(requireDb(), "products", id));

  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("Product not found.");
  }

  return snapshot;
}

function withCreateTimestamps<T extends object>(value: T) {
  const timestamp = new Date().toISOString();
  return { ...value, createdAt: timestamp, updatedAt: timestamp };
}

function clean<T extends object>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, current]) => current !== undefined)) as T;
}

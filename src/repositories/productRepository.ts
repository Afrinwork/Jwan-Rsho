import {
  collection,
  collectionGroup,
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

import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";
import { buildProductCreateData, buildProductUpdateData, ProductWrite } from "@/src/repositories/productRepositoryData";
import { mapSnapshot, requireCurrentUserId, requireDb } from "@/src/repositories/repositoryContext";
import { Product } from "@/src/types/product";

export const productRepository = {
  async createProduct(input: ProductWrite) {
    const ownerId = requireCurrentUserId();
    await ensureUniqueProductName(input.name, ownerId);
    const productRef = doc(collection(requireDb(), "products"));
    await setDoc(productRef, withCreateTimestamps(buildProductCreateData(input, ownerId)));
    return productRef.id;
  },

  async updateProduct(id: string, input: Partial<ProductWrite>) {
    const snapshot = await getOwnedProduct(id);
    if (input.name) {
      await ensureUniqueProductName(input.name, snapshot.data().ownerId, id);
    }
    await updateDoc(snapshot.ref, { ...clean(buildProductUpdateData(input)), updatedAt: new Date().toISOString() });
  },

  async deactivateProduct(id: string) {
    const snapshot = await getOwnedProduct(id);
    await updateDoc(snapshot.ref, { isActive: false, updatedAt: new Date().toISOString() });
  },

  async deleteProduct(id: string) {
    const snapshot = await getOwnedProduct(id);
    const usageCount = await getProductUsageCount(id);

    if (usageCount > 0) {
      throw new Error("Produkt wird bereits in Bestellungen verwendet und kann nicht geloescht werden.");
    }

    await deleteDoc(snapshot.ref);
  },

  async getProducts() {
    const ownerId = requireCurrentUserId();
    const productQuery = query(collection(requireDb(), "products"), where("ownerId", "==", ownerId));
    return sortProducts((await getDocs(productQuery)).docs.map((value) => mapSnapshot<Product>(value)));
  },
};

async function getProductUsageCount(productId: string) {
  const usageQuery = query(collectionGroup(requireDb(), "items"), where("productId", "==", productId));
  return (await getCountFromServer(usageQuery)).data().count;
}

async function ensureUniqueProductName(name: string, ownerId: string, excludeId?: string) {
  const normalizedName = name.trim().toLowerCase();
  const productQuery = query(
    collection(requireDb(), "products"),
    where("ownerId", "==", ownerId),
    where("normalizedName", "==", normalizedName),
  );
  const existing = await getDocs(productQuery);
  const hasDuplicate = existing.docs.some((value) => value.id !== excludeId);

  if (hasDuplicate) {
    throw new AppError(errorMessages.duplicateProduct);
  }
}

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

function sortProducts(products: Product[]) {
  return [...products].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }
    return left.name.localeCompare(right.name, "de");
  });
}

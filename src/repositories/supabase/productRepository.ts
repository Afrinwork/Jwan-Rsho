import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";
import { buildProductCreateData, buildProductUpdateData, ProductWrite } from "@/src/repositories/productRepositoryData";
import { toCamelCase, toSnakeCase } from "@/src/repositories/supabase/caseMapping";
import { requireCurrentUserId, requireSupabase } from "@/src/repositories/supabase/repositoryContext";
import { Product } from "@/src/types/product";
import type { Database } from "@/src/types/supabase";
import { generateUuid } from "@/src/utils/uuid";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

export const productRepository = {
  async createProduct(input: ProductWrite) {
    const ownerId = requireCurrentUserId();
    await ensureUniqueProductName(input.name, ownerId);
    const id = generateUuid();
    const timestamp = new Date().toISOString();
    const { error } = await requireSupabase()
      .from("products")
      .insert({
        ...toSnakeCase(buildProductCreateData(input, ownerId)),
        id,
        created_at: timestamp,
        updated_at: timestamp,
      } as ProductInsert);
    if (error) throw error;
    return id;
  },

  async updateProduct(id: string, input: Partial<ProductWrite>) {
    const product = await getOwnedProduct(id);
    if (input.name) {
      await ensureUniqueProductName(input.name, product.ownerId, id);
    }
    const { error } = await requireSupabase()
      .from("products")
      .update({ ...toSnakeCase(buildProductUpdateData(input)), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async deactivateProduct(id: string) {
    await getOwnedProduct(id);
    const { error } = await requireSupabase()
      .from("products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async deleteProduct(id: string) {
    const product = await getOwnedProduct(id);
    const usageCount = await getProductUsageCount(id, product.ownerId);

    if (usageCount > 0) {
      throw new Error("Produkt wird bereits in Bestellungen verwendet und kann nicht geloescht werden.");
    }

    const { error } = await requireSupabase().from("products").delete().eq("id", id);
    if (error) throw error;
  },

  async getProducts() {
    const ownerId = requireCurrentUserId();
    const { data, error } = await requireSupabase().from("products").select("*").eq("owner_id", ownerId);
    if (error) throw error;
    return sortProducts((data ?? []).map((row) => toCamelCase<Product>(row)));
  },
};

// Scoped by ownerId as well as productId via the order_items -> orders
// join (order_items has no owner_id column of its own -- see schema
// notes in supabase/migrations).
async function getProductUsageCount(productId: string, ownerId: string) {
  const { count, error } = await requireSupabase()
    .from("order_items")
    .select("*, orders!inner(owner_id)", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("orders.owner_id", ownerId);
  if (error) throw error;
  return count ?? 0;
}

async function ensureUniqueProductName(name: string, ownerId: string, excludeId?: string) {
  const normalizedName = name.trim().toLowerCase();
  const { data, error } = await requireSupabase()
    .from("products")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("normalized_name", normalizedName);
  if (error) throw error;

  const hasDuplicate = (data ?? []).some((value) => value.id !== excludeId);
  if (hasDuplicate) {
    throw new AppError(errorMessages.duplicateProduct);
  }
}

async function getOwnedProduct(id: string): Promise<Product> {
  const { data, error } = await requireSupabase().from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Product not found.");
  return toCamelCase<Product>(data);
}

function sortProducts(products: Product[]) {
  return [...products].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }
    return left.name.localeCompare(right.name, "de");
  });
}

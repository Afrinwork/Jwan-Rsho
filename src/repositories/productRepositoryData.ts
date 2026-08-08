import { z } from "zod";

import { productSchema } from "@/src/features/products/validation/productSchema";

export type ProductWrite = z.input<typeof productSchema>;

export function buildProductCreateData(input: ProductWrite, ownerId: string) {
  const parsed = productSchema.parse(input);
  return {
    ownerId,
    name: parsed.name.trim(),
    normalizedName: parsed.name.trim().toLowerCase(),
    defaultUnit: parsed.defaultUnit.trim(),
    isActive: parsed.isActive ?? true,
    sortOrder: parsed.sortOrder ?? 0,
  };
}

export function buildProductUpdateData(input: Partial<ProductWrite>) {
  const parsed = productSchema.partial().parse(input);
  return {
    ...parsed,
    name: parsed.name?.trim(),
    normalizedName: parsed.name?.trim().toLowerCase(),
    defaultUnit: parsed.defaultUnit?.trim(),
  };
}

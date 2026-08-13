import { z } from "zod";

import { citySchema } from "@/src/features/cities/validation/citySchema";

export type CityWrite = z.input<typeof citySchema>;

export function buildCityCreateData(input: CityWrite, ownerId: string) {
  const parsed = citySchema.parse(input);
  return {
    ownerId,
    name: parsed.name.trim(),
    normalizedName: parsed.name.trim().toLowerCase(),
    ...(parsed.nameAr ? { nameAr: parsed.nameAr.trim() } : {}),
    sortOrder: parsed.sortOrder ?? 0,
    isActive: parsed.isActive ?? true,
  };
}

export function buildCityUpdateData(input: Partial<CityWrite>) {
  const parsed = citySchema.partial().parse(input);
  return {
    ...parsed,
    name: parsed.name?.trim(),
    normalizedName: parsed.name?.trim().toLowerCase(),
    nameAr: parsed.nameAr?.trim(),
  };
}

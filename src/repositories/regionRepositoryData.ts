import { z } from "zod";

import { regionSchema } from "@/src/features/regions/validation/regionSchema";

export type RegionWrite = z.input<typeof regionSchema>;

export function buildRegionCreateData(input: RegionWrite, ownerId: string) {
  const parsed = regionSchema.parse(input);
  return {
    ownerId,
    name: parsed.name.trim(),
    normalizedName: parsed.name.trim().toLowerCase(),
    country: parsed.country.trim(),
    normalizedCountry: parsed.country.trim().toLowerCase(),
    city: parsed.city?.trim(),
    normalizedCity: parsed.city?.trim().toLowerCase(),
    isActive: parsed.isActive ?? true,
  };
}

export function buildRegionUpdateData(input: Partial<RegionWrite>) {
  const parsed = regionSchema.partial().parse(input);
  return {
    ...parsed,
    name: parsed.name?.trim(),
    normalizedName: parsed.name?.trim().toLowerCase(),
    country: parsed.country?.trim(),
    normalizedCountry: parsed.country?.trim().toLowerCase(),
    city: parsed.city?.trim(),
    normalizedCity: parsed.city?.trim().toLowerCase(),
  };
}

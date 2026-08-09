import { z } from "zod";

import { countrySchema } from "@/src/features/countries/validation/countrySchema";

export type CountryWrite = z.input<typeof countrySchema>;

export function buildCountryCreateData(input: CountryWrite, ownerId: string) {
  const parsed = countrySchema.parse(input);
  return {
    ownerId,
    name: parsed.name.trim(),
    normalizedName: parsed.name.trim().toLowerCase(),
    ...(parsed.isoCode ? { isoCode: parsed.isoCode.trim().toUpperCase() } : {}),
    sortOrder: parsed.sortOrder ?? 0,
    isActive: parsed.isActive ?? true,
  };
}

export function buildCountryUpdateData(input: Partial<CountryWrite>) {
  const parsed = countrySchema.partial().parse(input);
  return {
    ...parsed,
    name: parsed.name?.trim(),
    normalizedName: parsed.name?.trim().toLowerCase(),
    isoCode: parsed.isoCode?.trim().toUpperCase(),
  };
}

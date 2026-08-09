import { z } from "zod";

import { customerSchema } from "@/src/features/customers/validation/customerSchema";
import { normalizeCity } from "@/src/utils/normalizeCity";

export type CustomerWrite = z.input<typeof customerSchema>;

export function buildCustomerCreateData(input: CustomerWrite, ownerId: string) {
  const parsed = customerSchema.parse(input);
  return {
    ownerId,
    fullName: parsed.fullName.trim(),
    phone: parsed.phone.trim(),
    address: parsed.address.trim(),
    city: parsed.city.trim(),
    normalizedCity: normalizeCity(parsed.city),
    country: parsed.country.trim(),
    ...(parsed.region ? { region: parsed.region.trim() } : {}),
    ...(parsed.latitude !== undefined ? { latitude: parsed.latitude } : {}),
    ...(parsed.longitude !== undefined ? { longitude: parsed.longitude } : {}),
    ...(parsed.note ? { note: parsed.note.trim() } : {}),
    isActive: parsed.isActive ?? true,
  };
}

export function buildCustomerUpdateData(input: Partial<CustomerWrite>) {
  const parsed = customerSchema.partial().parse(input);
  return {
    ...parsed,
    city: parsed.city?.trim(),
    normalizedCity: parsed.city ? normalizeCity(parsed.city) : undefined,
  };
}

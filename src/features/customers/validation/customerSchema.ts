import { z } from "zod";

import { t } from "@/src/i18n/i18n";

export const customerSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  fullName: z.string().trim().min(1, t("customers:validation.nameRequired")),
  phone: z.string().trim().optional().default(""),
  // Street is optional — a bare city (e.g. just "Berlin") is enough to
  // geocode and place the customer on the map. City/country stay required
  // since geocoding needs at least that much to resolve anything.
  address: z.string().trim().optional().default(""),
  city: z.string().trim().min(1, t("customers:validation.cityRequired")),
  normalizedCity: z.string().optional(),
  country: z.string().trim().min(1, t("customers:validation.countryRequired")),
  region: z.string().trim().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  note: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

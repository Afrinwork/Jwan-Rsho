import { z } from "zod";

import { t } from "@/src/i18n/i18n";

export const customerSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  fullName: z.string().trim().min(1, t("customers:validation.nameRequired")),
  phone: z.string().trim().min(1, t("customers:validation.phoneRequired")),
  address: z.string().trim().min(1, t("customers:validation.addressRequired")),
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

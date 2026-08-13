import { z } from "zod";

import { t } from "@/src/i18n/i18n";

export const regionSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  name: z.string().trim().min(1, t("regions:validation.nameRequired")),
  nameAr: z.string().trim().optional(),
  normalizedName: z.string().optional(),
  country: z.string().trim().min(1, t("regions:validation.countryRequired")),
  normalizedCountry: z.string().optional(),
  city: z.string().trim().optional(),
  normalizedCity: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

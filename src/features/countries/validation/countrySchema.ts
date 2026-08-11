import { z } from "zod";

import { t } from "@/src/i18n/i18n";

export const countrySchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  name: z.string().trim().min(1, t("countries:validation.nameRequired")),
  normalizedName: z.string().optional(),
  isoCode: z.string().trim().max(3, t("countries:validation.isoCodeTooLong")).optional(),
  sortOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

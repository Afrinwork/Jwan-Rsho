import { z } from "zod";

import { t } from "@/src/i18n/i18n";

export const citySchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  name: z.string().trim().min(1, t("cities:validation.nameRequired")),
  nameAr: z.string().trim().optional(),
  normalizedName: z.string().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

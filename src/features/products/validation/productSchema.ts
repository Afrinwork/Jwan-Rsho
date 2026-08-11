import { z } from "zod";

import { t } from "@/src/i18n/i18n";

export const productSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  name: z.string().trim().min(1, t("products:validation.nameRequired")),
  normalizedName: z.string().optional(),
  defaultUnit: z.string().trim().min(1, t("products:validation.defaultUnitRequired")),
  emoji: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

import { z } from "zod";

import { t } from "@/src/i18n/i18n";

export const orderItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().trim().min(1, t("orders:validation.productRequired")),
  productNameSnapshot: z.string().trim().min(1, t("orders:validation.productNameRequired")),
  quantity: z.number().positive(t("orders:validation.quantityPositive")),
  unit: z.string().trim().min(1, t("orders:validation.unitRequired")),
  sortOrder: z.number().int().nonnegative().default(0),
});

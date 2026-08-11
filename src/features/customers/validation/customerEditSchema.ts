import { z } from "zod";

import { customerSchema } from "@/src/features/customers/validation/customerSchema";
import { orderItemSchema } from "@/src/features/orders/validation/orderItemSchema";
import { t } from "@/src/i18n/i18n";

export const customerEditSchema = z.object({
  customerId: z.string().trim().min(1, t("customers:validation.customerRequired")),
  customer: customerSchema,
  items: z.array(orderItemSchema).min(1, t("customers:validation.itemsRequired")),
});

export type CustomerEditFormValues = z.output<typeof customerEditSchema>;

import { z } from "zod";

import { customerSchema } from "@/src/features/customers/validation/customerSchema";
import { orderItemSchema } from "@/src/features/orders/validation/orderItemSchema";

export const customerEditSchema = z.object({
  customerId: z.string().trim().min(1, "Bitte Kunden auswaehlen"),
  customer: customerSchema,
  items: z.array(orderItemSchema).min(1, "Mindestens ein Produkt hinzufuegen"),
});

export type CustomerEditFormValues = z.output<typeof customerEditSchema>;

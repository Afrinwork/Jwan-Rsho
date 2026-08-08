import { z } from "zod";

import { customerSchema } from "@/src/features/customers/validation/customerSchema";
import { orderItemSchema } from "@/src/features/orders/validation/orderItemSchema";
import { CustomerMode } from "@/src/features/orders/types/orderFormTypes";

const addOrderBaseSchema = z.object({
  customerId: z.string(),
  customer: customerSchema.partial(),
  items: z.array(orderItemSchema).min(1, "Mindestens ein Produkt hinzufuegen"),
});

export type AddOrderFormValues = z.input<typeof addOrderBaseSchema>;

export function buildAddOrderFormSchema(mode: CustomerMode) {
  return addOrderBaseSchema.superRefine((value, ctx) => {
    if (mode === "existing" && value.customerId.trim().length === 0) {
      ctx.addIssue({ code: "custom", path: ["customerId"], message: "Bitte Kunden auswaehlen" });
    }

    if (mode !== "new") {
      return;
    }

    const parsedCustomer = customerSchema.safeParse(value.customer);
    if (parsedCustomer.success) {
      return;
    }

    for (const issue of parsedCustomer.error.issues) {
      ctx.addIssue({ ...issue, path: ["customer", ...issue.path] });
    }
  });
}

export function buildEmptyOrderCustomer(): z.input<typeof customerSchema> {
  return {
    fullName: "",
    phone: "",
    note: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    country: "",
    region: "",
  };
}

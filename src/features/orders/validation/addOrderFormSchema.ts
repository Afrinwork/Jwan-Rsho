import { z } from "zod";

import { customerSchema } from "@/src/features/customers/validation/customerSchema";
import { orderItemSchema } from "@/src/features/orders/validation/orderItemSchema";
import { CustomerMode } from "@/src/features/orders/types/orderFormTypes";

// Deliberately lenient: in "existing customer" mode this slice of the form stays at its
// empty default (see buildEmptyOrderCustomer) and is never shown or filled in. It must not
// be checked against customerSchema's required-field rules (min-length etc.), otherwise the
// whole form silently fails validation for a section the user can't even see. The real,
// strict check for "new customer" mode happens in the superRefine below.
const looseCustomerDraft = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  note: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isActive: z.boolean().optional(),
});

const addOrderBaseSchema = z.object({
  customerId: z.string(),
  customer: looseCustomerDraft,
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
    address: "",
    city: "",
    country: "",
    region: "",
  };
}

import { z } from "zod";

export const orderItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().trim().min(1, "Produkt erforderlich"),
  productNameSnapshot: z.string().trim().min(1, "Produktname erforderlich"),
  quantity: z.number().positive("Menge muss groesser als 0 sein"),
  unit: z.string().trim().min(1, "Einheit erforderlich"),
  sortOrder: z.number().int().nonnegative().default(0),
});

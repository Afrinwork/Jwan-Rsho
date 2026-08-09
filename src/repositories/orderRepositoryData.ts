import { z } from "zod";

import { orderSchema } from "@/src/features/orders/validation/orderSchema";
import { buildCustomerCreateData, CustomerWrite } from "@/src/repositories/customerRepositoryData";

export const createOrderInputSchema = orderSchema
  .pick({ customerId: true, customer: true, note: true, orderedAt: true, items: true })
  .refine((value) => Boolean(value.customerId) !== Boolean(value.customer), {
    message: "Order requires either customerId or customer payload",
  });

export type CreateOrderInput = z.input<typeof createOrderInputSchema>;

export function buildOrderCreateData(input: CreateOrderInput, ownerId: string, customerId: string) {
  const parsed = createOrderInputSchema.parse(input);
  return {
    ownerId,
    customerId,
    status: "open" as const,
    ...(parsed.note ? { note: parsed.note.trim() } : {}),
    orderedAt: parsed.orderedAt ?? new Date().toISOString(),
  };
}

type OrderItemWrite = z.input<typeof orderSchema.shape.items.element>;

export function buildOrderItemData(item: OrderItemWrite, itemId: string, ownerId: string) {
  return {
    id: itemId,
    ownerId,
    productId: item.productId,
    productNameSnapshot: item.productNameSnapshot.trim(),
    quantity: item.quantity,
    unit: item.unit.trim(),
    sortOrder: item.sortOrder,
  };
}

export function buildNewCustomerForOrder(input: CustomerWrite, ownerId: string) {
  return buildCustomerCreateData(input, ownerId);
}

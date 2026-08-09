import { Customer } from "@/src/types/customer";
import { OrderWithItems } from "@/src/types/order";

import { CustomerEditFormValues } from "@/src/features/customers/validation/customerEditSchema";

export function buildCustomerEditFormValues(customer: Customer, openOrder: OrderWithItems): CustomerEditFormValues {
  return {
    customerId: customer.id,
    customer: {
      fullName: customer.fullName,
      phone: customer.phone,
      note: customer.note ?? "",
      address: customer.address,
      city: customer.city,
      country: customer.country,
      region: customer.region ?? "",
      latitude: customer.latitude,
      longitude: customer.longitude,
      isActive: customer.isActive,
    },
    items: openOrder.items.map((item) => ({
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot,
      quantity: item.quantity,
      unit: item.unit,
      sortOrder: item.sortOrder,
    })),
  };
}

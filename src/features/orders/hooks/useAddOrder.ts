import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { customerSchema } from "@/src/features/customers/validation/customerSchema";
import { CustomerMode } from "@/src/features/orders/types/orderFormTypes";
import {
  AddOrderFormValues,
  buildAddOrderFormSchema,
  buildEmptyOrderCustomer,
} from "@/src/features/orders/validation/addOrderFormSchema";
import { orderRepository } from "@/src/repositories/orderRepository";
import { CreateOrderInput } from "@/src/repositories/orderRepositoryData";
import { Customer } from "@/src/types/customer";
import { geocodingService } from "@/src/services/geocodingService";
import { formatError } from "@/src/utils/formatError";
import { guardAsync } from "@/src/utils/guardAsync";

const defaultValues: AddOrderFormValues = {
  customerId: "",
  customer: buildEmptyOrderCustomer(),
  items: [],
};

export function useAddOrder() {
  const [customerMode, setCustomerMode] = useState<CustomerMode>("new");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [guardedCreateOrder] = useState(() => guardAsync(orderRepository.createOrder.bind(orderRepository)));

  const form = useForm<AddOrderFormValues>({
    resolver: zodResolver(buildAddOrderFormSchema(customerMode)),
    defaultValues,
  });

  const items = useFieldArray({ control: form.control, name: "items" });

  function setMode(mode: CustomerMode) {
    setCustomerMode(mode);
    setSelectedCustomer(null);
    form.setValue("customerId", "");
    setSubmitError(null);
    setSuccessMessage(null);
  }

  function selectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    form.setValue("customerId", customer.id, { shouldValidate: true });
  }

  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const payload: CreateOrderInput =
        customerMode === "existing"
          ? { customerId: values.customerId, items: values.items }
          : {
              customer: {
                ...customerSchema.parse(values.customer),
                ...(await buildCustomerCoordinates(values.customer)),
              },
              items: values.items,
            };

      await guardedCreateOrder(payload);
      setSuccessMessage("Bestellung wurde gespeichert.");
      form.reset(defaultValues);
      setCustomerMode("new");
      setSelectedCustomer(null);
    } catch (error) {
      setSubmitError(formatError(error).message);
    }
  });

  return {
    form,
    items,
    customerMode,
    setMode,
    selectedCustomer,
    selectCustomer,
    submit,
    submitError,
    successMessage,
  };
}

async function buildCustomerCoordinates(customer: AddOrderFormValues["customer"]) {
  const coordinates = await geocodingService.geocodeCustomerAddressSafely({
    address: customer.address ?? "",
    city: customer.city ?? "",
    country: customer.country ?? "",
    region: customer.region,
  });

  return {
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
  };
}

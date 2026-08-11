import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Resolver, useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { customerSchema } from "@/src/features/customers/validation/customerSchema";
import { customerRepository } from "@/src/repositories/customerRepository";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { geocodingService } from "@/src/services/geocodingService";
import { formatError } from "@/src/utils/formatError";

import { buildCustomerEditFormValues } from "@/src/features/customers/services/customerEditService";
import {
  CustomerEditFormValues,
  customerEditSchema,
} from "@/src/features/customers/validation/customerEditSchema";

const defaultValues: CustomerEditFormValues = {
  customerId: "",
  customer: {
    fullName: "",
    phone: "",
    note: "",
    address: "",
    city: "",
    country: "",
    region: "",
    isActive: true,
  },
  items: [],
};

export function useCustomerEdit(customerId: string) {
  const { t } = useTranslation("customers");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const form = useForm<CustomerEditFormValues>({
    resolver: zodResolver(customerEditSchema) as Resolver<CustomerEditFormValues>,
    defaultValues,
  });

  const items = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    Promise.all([
      customerRepository.getCustomerById(customerId),
      orderDetailsRepository.getOrdersByCustomerWithItems(customerId),
    ])
      .then(([customer, orders]) => {
        const openOrder = orders.find((value) => value.status === "open");

        if (!openOrder) {
          throw new Error(t("edit.noOpenOrder"));
        }

        setOpenOrderId(openOrder.id);
        form.reset(buildCustomerEditFormValues(customer, openOrder));
      })
      .catch((loadError) => setError(formatError(loadError).message))
      .finally(() => setLoading(false));
  }, [customerId, form, t]);

  const submit = form.handleSubmit(async (values) => {
    if (!openOrderId) {
      setError(t("edit.noOpenOrder"));
      return false;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const parsedCustomer = customerSchema.parse(values.customer);
      const coordinates = await geocodingService.geocodeCustomerAddressSafely({
        address: parsedCustomer.address,
        city: parsedCustomer.city,
        country: parsedCustomer.country,
        region: parsedCustomer.region,
      });

      await orderRepository.updateOpenOrderCustomerAndItems({
        customerId,
        orderId: openOrderId,
        customer: {
          ...parsedCustomer,
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
        },
        items: values.items.map((item: CustomerEditFormValues["items"][number], index: number) => ({
          ...item,
          sortOrder: item.sortOrder ?? index,
        })),
      });

      setSuccessMessage(t("edit.saveSuccess"));
      return true;
    } catch (submitError) {
      setError(formatError(submitError).message);
      return false;
    } finally {
      setSaving(false);
    }
  });

  return {
    form,
    items,
    loading,
    saving,
    error,
    successMessage,
    submit,
  };
}

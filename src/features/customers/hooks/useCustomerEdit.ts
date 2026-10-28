import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Resolver, useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { canManageDrivers } from "@/src/features/auth/permissions";
import { withAddressNote } from "@/src/features/customers/services/addressNote";
import { customerSchema } from "@/src/features/customers/validation/customerSchema";
import { useOwnDrivers } from "@/src/features/orders/hooks/useOwnDrivers";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
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
  // Admins can (re)assign the customer to one of their drivers here, same as
  // on the order form; null keeps the customer with the admin.
  const canAssignDriver = canManageDrivers(useCurrentUser());
  const { drivers, loadingDrivers, driversError } = useOwnDrivers(canAssignDriver);
  const [savedDriverId, setSavedDriverId] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);

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
        setOpenOrderId(openOrder?.id ?? null);
        setSavedDriverId(customer.assignedDriverId ?? null);
        setDriverId(customer.assignedDriverId ?? null);
        form.reset(buildCustomerEditFormValues(customer, openOrder ?? null));
      })
      .catch((loadError) => setError(formatError(loadError).message))
      .finally(() => setLoading(false));
  }, [customerId, form, t]);

  const submit = form.handleSubmit(async (values) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const parsedCustomer = withAddressNote(customerSchema.parse(values.customer));
      const coordinates = await geocodingService.geocodeCustomerAddressSafely({
        address: parsedCustomer.address,
        city: parsedCustomer.city,
        country: parsedCustomer.country,
        region: parsedCustomer.region,
      });

      const customerPayload = {
        ...parsedCustomer,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        locationStatus: coordinates ? ("ok" as const) : ("failed" as const),
      };

      if (openOrderId) {
        if (!values.items.length) {
          form.setError("items", { message: t("validation.itemsRequired") });
          return false;
        }

        await orderRepository.updateOpenOrderCustomerAndItems({
          customerId,
          orderId: openOrderId,
          customer: customerPayload,
          items: values.items.map((item: CustomerEditFormValues["items"][number], index: number) => ({
            ...item,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      } else {
        await customerRepository.updateCustomer(customerId, customerPayload);
      }

      // assign_customer_driver also mirrors the driver onto the customer's
      // open orders, so the driver sees them live on their map.
      if (canAssignDriver && driverId !== savedDriverId) {
        await customerRepository.assignDriver(customerId, driverId);
        setSavedDriverId(driverId);
      }

      setSuccessMessage(openOrderId ? t("edit.saveSuccess") : t("edit.saveCustomerSuccess"));
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
    hasOpenOrder: Boolean(openOrderId),
    canAssignDriver,
    driverId,
    setDriverId,
    drivers,
    loadingDrivers,
    driversError,
    submit,
  };
}

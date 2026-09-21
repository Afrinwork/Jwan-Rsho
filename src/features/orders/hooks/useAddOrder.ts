import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { customerSchema } from "@/src/features/customers/validation/customerSchema";
import { CustomerMode } from "@/src/features/orders/types/orderFormTypes";
import {
  AddOrderFormValues,
  buildAddOrderFormSchema,
  buildEmptyOrderCustomer,
} from "@/src/features/orders/validation/addOrderFormSchema";
import { orderRepository } from "@/src/repositories/orderRepository";
import { CreateOrderInput } from "@/src/repositories/orderRepositoryData";
import { CustomerWrite } from "@/src/repositories/customerRepositoryData";
import { Customer } from "@/src/types/customer";
import { geocodingService } from "@/src/services/geocodingService";
import { formatError } from "@/src/utils/formatError";
import { guardAsync } from "@/src/utils/guardAsync";
import { isOrderAlreadyExistsError } from "@/src/features/orders/services/orderIdempotencyService";

const defaultValues: AddOrderFormValues = {
  customerId: "",
  customer: buildEmptyOrderCustomer(),
  items: [],
};

export function useAddOrder() {
  const { t } = useTranslation("orders");
  const [customerMode, setCustomerMode] = useState<CustomerMode>("new");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [guardedCreateOrder] = useState(() => guardAsync(orderRepository.createOrder.bind(orderRepository)));
  // Minted once per save attempt and reused across a double-tap or a
  // retry-after-error, so createOrder()'s transaction can catch the
  // duplicate by document id instead of silently creating a second order
  // (or, on a slow retry, orphaning the first one's customer/items) — see
  // isOrderAlreadyExistsError below. Regenerated only after a save actually
  // succeeds (or is recognized as an idempotent duplicate of one that did).
  // Plain state, not a ref: it's read and reassigned from inside
  // form.handleSubmit's callback, which React Compiler's lint rules treat as
  // render-adjacent — refs aren't safe to touch there, state is.
  const [draftIds, setDraftIds] = useState(() => orderRepository.createDraftIds());

  const form = useForm<AddOrderFormValues>({
    resolver: zodResolver(buildAddOrderFormSchema(customerMode)),
    defaultValues,
  });

  const items = useFieldArray({ control: form.control, name: "items" });

  function selectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setCustomerMode("existing");
    form.setValue("customerId", customer.id, { shouldValidate: true });
    form.setValue("customer", mapCustomerToFormValues(customer));
  }

  function clearCustomer() {
    setSelectedCustomer(null);
    setCustomerMode("new");
    form.setValue("customerId", "");
    setSubmitError(null);
    setSuccessMessage(null);
  }

  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const payload: CreateOrderInput & { customer?: CustomerWrite; id?: string; newCustomerId?: string; requestId?: string } =
        customerMode === "existing"
          ? { customerId: values.customerId, items: values.items, id: draftIds.orderId, requestId: draftIds.orderId }
          : {
              customer: {
                ...customerSchema.parse(values.customer),
                ...(await buildCustomerCoordinates(values.customer)),
              },
              items: values.items,
              id: draftIds.orderId,
              newCustomerId: draftIds.customerId,
              requestId: draftIds.orderId,
            };

      await guardedCreateOrder(payload);
      onSaveSucceeded();
    } catch (error) {
      if (isOrderAlreadyExistsError(error)) {
        // This exact save attempt already went through (a double-tap that
        // slipped past the disabled button, or a retry after the first
        // call's response was lost) — the order is safely saved, just not by
        // THIS call. Idempotent no-op, not a failure.
        onSaveSucceeded();
      } else {
        setSubmitError(formatError(error).message);
      }
    }
  });

  function onSaveSucceeded() {
    setSuccessMessage(t("save.success"));
    form.reset(defaultValues);
    setCustomerMode("new");
    setSelectedCustomer(null);
    setDraftIds(orderRepository.createDraftIds());
  }

  return {
    form,
    items,
    selectedCustomer,
    selectCustomer,
    clearCustomer,
    submit,
    submitError,
    successMessage,
  };
}

function mapCustomerToFormValues(customer: Customer): AddOrderFormValues["customer"] {
  return {
    fullName: customer.fullName,
    phone: customer.phone,
    note: customer.note ?? "",
    address: customer.address,
    city: customer.city,
    country: customer.country,
    region: customer.region ?? "",
  };
}

// Geocoding failing (bad address, network hiccup, a rate-limited provider)
// never blocks the order/customer from saving — geocodeCustomerAddressSafely
// already swallows every error into `null`. What used to be silent here is
// the customer then having no coordinates and no way to tell why: marking
// locationStatus "failed" surfaces it in the map's "Adresse pruefen" list
// (see mapCustomerService.getCustomersNeedingAddressCheck) instead of the
// customer just quietly never appearing anywhere.
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
    locationStatus: coordinates ? ("ok" as const) : ("failed" as const),
  };
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { withAddressNote } from "@/src/features/customers/services/addressNote";
import { diffExistingCustomerEdits } from "@/src/features/orders/services/existingCustomerEdits";
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
import { canManageDrivers, isDriver } from "@/src/features/auth/permissions";
import { buildDriverOrderNote } from "@/src/features/orders/services/driverOrderNote";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { customerRepository } from "@/src/repositories/customerRepository";
import { useOwnDrivers } from "@/src/features/orders/hooks/useOwnDrivers";
import { useTripAdditionStore } from "@/src/features/route/store/tripAdditionStore";

const defaultValues: AddOrderFormValues = {
  customerId: "",
  customer: buildEmptyOrderCustomer(),
  items: [],
};

export function useAddOrder() {
  const { t } = useTranslation("orders");
  const currentUser = useCurrentUser();
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
  // Admins can assign the order's customer to one of their drivers right
  // from the form; null keeps the customer unassigned.
  const canAssignDriver = canManageDrivers(currentUser);
  const [driverId, setDriverId] = useState<string | null>(null);
  const { drivers, loadingDrivers, driversError } = useOwnDrivers(canAssignDriver);

  const form = useForm<AddOrderFormValues>({
    resolver: zodResolver(buildAddOrderFormSchema(customerMode)),
    defaultValues,
  });

  const items = useFieldArray({ control: form.control, name: "items" });
  // Offered on the form while the person's own trip is started (admins —
  // a driver's new customers join their trip anyway).
  const tripStarted = useTripAdditionStore((state) => state.tripStarted);
  const requestTripAddition = useTripAdditionStore((state) => state.requestAddition);
  const canAddToTrip = tripStarted && !isDriver(currentUser);

  function selectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setCustomerMode("existing");
    form.setValue("customerId", customer.id, { shouldValidate: true });
    form.setValue("customer", mapCustomerToFormValues(customer));
    setDriverId(customer.assignedDriverId ?? null);
  }

  function clearCustomer() {
    setSelectedCustomer(null);
    setCustomerMode("new");
    setDriverId(null);
    form.setValue("customerId", "");
    setSubmitError(null);
    setSuccessMessage(null);
  }

  // addToTrip: the saved customer also joins the running trip, live.
  const saveOrder = (addToTrip: boolean) => form.handleSubmit(async (values) => {
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      // Marks a driver-created order for the admin (see buildDriverOrderNote).
      const driverNote = isDriver(currentUser) ? { note: buildDriverOrderNote(currentUser?.displayName ?? currentUser?.email) } : {};
      const payload: CreateOrderInput & { customer?: CustomerWrite; id?: string; newCustomerId?: string; requestId?: string } =
        customerMode === "existing"
          ? { customerId: values.customerId, items: values.items, id: draftIds.orderId, requestId: draftIds.orderId, ...driverNote }
          : {
              ...driverNote,
              customer: {
                ...withAddressNote(customerSchema.parse(values.customer)),
                // Set with the customer itself (the order takes it over in the
                // same transaction), so it never shows up unassigned for a
                // moment and joins the admin's running trip by mistake.
                ...(isDriver(currentUser) ? { assignedDriverId: currentUser!.uid } : canAssignDriver && driverId ? { assignedDriverId: driverId } : {}),
                ...(await buildCustomerCoordinates(values.customer)),
              },
              items: values.items,
              id: draftIds.orderId,
              newCustomerId: draftIds.customerId,
              requestId: draftIds.orderId,
            };

      await saveExistingCustomerEdits(values.customer);
      await assignChosenDriver();
      await guardedCreateOrder(payload);
      onSaveSucceeded(addToTrip, values.customerId);
    } catch (error) {
      if (isOrderAlreadyExistsError(error)) {
        // This exact save attempt already went through (a double-tap that
        // slipped past the disabled button, or a retry after the first
        // call's response was lost) — the order is safely saved, just not by
        // THIS call. Idempotent no-op, not a failure.
        await assignChosenDriver().catch(() => undefined);
        onSaveSucceeded(addToTrip, values.customerId);
      } else {
        setSubmitError(formatError(error).message);
      }
    }
  });
  const submit = saveOrder(false);
  const submitToTrip = saveOrder(true);

  // A picked existing customer whose fields were changed here (e.g. the
  // street added now): saved too, instead of only the order. Drivers may not
  // update customers (RLS), so for them the order is saved as before.
  async function saveExistingCustomerEdits(customer: AddOrderFormValues["customer"]) {
    if (customerMode !== "existing" || !selectedCustomer || isDriver(currentUser)) return;
    const edits = diffExistingCustomerEdits(selectedCustomer, withAddressNote(customerSchema.parse(customer)));
    if (!edits) return;
    const coordinates = edits.locationChanged ? await buildCustomerCoordinates(customer) : {};
    await customerRepository.updateCustomer(selectedCustomer.id, { ...edits.changes, ...coordinates });
  }

  // Existing customer only (a new one gets the driver with the customer
  // itself): runs before the order is saved — assign_customer_driver sets the
  // customer's driver and mirrors it onto their open orders, and the new order
  // takes it over from the customer. Skipped when it wouldn't change.
  async function assignChosenDriver() {
    if (!canAssignDriver || customerMode !== "existing" || !selectedCustomer) return;
    if (driverId === (selectedCustomer.assignedDriverId ?? null)) return;
    await customerRepository.assignDriver(selectedCustomer.id, driverId);
  }

  function onSaveSucceeded(addToTrip: boolean, existingCustomerId: string) {
    if (addToTrip) requestTripAddition(customerMode === "existing" ? existingCustomerId : draftIds.customerId);
    setSuccessMessage(t("save.success"));
    form.reset(defaultValues);
    setCustomerMode("new");
    setSelectedCustomer(null);
    setDriverId(null);
    setDraftIds(orderRepository.createDraftIds());
  }

  return {
    form,
    items,
    canAssignDriver,
    driverId,
    setDriverId,
    drivers,
    loadingDrivers,
    driversError,
    selectedCustomer,
    selectCustomer,
    clearCustomer,
    submit,
    submitToTrip,
    canAddToTrip,
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

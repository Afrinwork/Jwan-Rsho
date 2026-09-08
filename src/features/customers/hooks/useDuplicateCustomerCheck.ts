import { useEffect, useMemo, useRef, useState } from "react";

import { customerRepository } from "@/src/repositories/customerRepository";
import { Customer } from "@/src/types/customer";

const DEBOUNCE_MS = 400;
const MIN_NAME_LENGTH = 3;
const MIN_ADDRESS_LENGTH = 5;
const MIN_PHONE_DIGITS = 4;
const MAX_MATCHES = 5;

export type CustomerMatchField = "phone" | "fullName" | "address";

export type CustomerMatch = {
  customer: Customer;
  fields: CustomerMatchField[];
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

// Live "does this customer already exist?" check for the new-customer form —
// the customer list is fetched once per form session (not per keystroke) and
// matching happens entirely in memory, so typing stays instant with no
// repeated Firestore reads.
export function useDuplicateCustomerCheck(fullName: string, phone: string, address: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [debouncedInputs, setDebouncedInputs] = useState({ fullName, phone, address });
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) {
      return;
    }

    const hasAnyInput = fullName.trim() || phone.trim() || address.trim();
    if (!hasAnyInput) {
      return;
    }

    loadedRef.current = true;
    customerRepository
      .getCustomers()
      .then(setCustomers)
      .catch(() => setCustomers([]));
  }, [fullName, phone, address]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedInputs({ fullName, phone, address });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [fullName, phone, address]);

  const matches = useMemo<CustomerMatch[]>(() => {
    const typedName = normalizeText(debouncedInputs.fullName);
    const typedAddress = normalizeText(debouncedInputs.address);
    const typedPhoneDigits = normalizePhoneDigits(debouncedInputs.phone);

    const nameActive = typedName.length >= MIN_NAME_LENGTH;
    const addressActive = typedAddress.length >= MIN_ADDRESS_LENGTH;
    const phoneActive = typedPhoneDigits.length >= MIN_PHONE_DIGITS;

    if (!nameActive && !addressActive && !phoneActive) {
      return [];
    }

    const found: CustomerMatch[] = [];

    for (const customer of customers) {
      const fields: CustomerMatchField[] = [];
      const customerPhoneDigits = normalizePhoneDigits(customer.phone);

      if (phoneActive && customerPhoneDigits && customerPhoneDigits.startsWith(typedPhoneDigits)) {
        fields.push("phone");
      }

      if (nameActive) {
        const customerName = normalizeText(customer.fullName);
        if (customerName.includes(typedName) || typedName.includes(customerName)) {
          fields.push("fullName");
        }
      }

      if (addressActive) {
        const customerAddress = normalizeText([customer.address, customer.city].filter(Boolean).join(", "));
        if (customerAddress.includes(typedAddress)) {
          fields.push("address");
        }
      }

      if (fields.length) {
        found.push({ customer, fields });
      }
    }

    // Strongest signal first: a phone match is far more likely to be the same
    // real person than a name/address substring match.
    found.sort((left, right) => Number(right.fields.includes("phone")) - Number(left.fields.includes("phone")));

    return found.slice(0, MAX_MATCHES);
  }, [customers, debouncedInputs]);

  return { matches };
}

import { useState } from "react";

import { customerRepository } from "@/src/repositories/customerRepository";
import { userRepository } from "@/src/repositories/userRepository";
import { UserProfile } from "@/src/types/user";
import { formatError } from "@/src/utils/formatError";

export function useDriverAssignment() {
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [visible, setVisible] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setVisible(true);
    setError(null);
    setLoadingDrivers(true);

    try {
      setDrivers(await userRepository.getOwnDrivers());
    } catch (loadError) {
      setError(formatError(loadError).message);
    } finally {
      setLoadingDrivers(false);
    }
  }

  function close() {
    setVisible(false);
    setError(null);
  }

  async function assign(customerId: string, driverId: string | null) {
    return assignMany([customerId], driverId);
  }

  async function assignMany(customerIds: string[], driverId: string | null) {
    const uniqueCustomerIds = [...new Set(customerIds)];
    if (!uniqueCustomerIds.length) return false;

    setAssigning(true);
    setError(null);

    try {
      await Promise.all(uniqueCustomerIds.map((customerId) => customerRepository.assignDriver(customerId, driverId)));
      setVisible(false);
      return true;
    } catch (assignError) {
      setError(formatError(assignError).message);
      return false;
    } finally {
      setAssigning(false);
    }
  }

  return { assign, assignMany, assigning, close, drivers, error, loadingDrivers, open, visible };
}

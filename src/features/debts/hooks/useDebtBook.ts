import { useEffect } from "react";
import { create } from "zustand";

import { canAccessFullApp } from "@/src/features/auth/permissions";
import { CustomerDebtSummary, summarizeByCustomer } from "@/src/features/debts/services/debtFormat";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { debtRepository } from "@/src/repositories/debtRepository";
import { Debt } from "@/src/types/debt";
import { formatError } from "@/src/utils/formatError";

type DebtBookState = {
  debts: Debt[];
  // customerId -> open balance + newest note, computed once per change and
  // shared: a customer list renders one box per customer.
  summaries: Map<string, CustomerDebtSummary>;
  loading: boolean;
  error: string | null;
};

const INITIAL: DebtBookState = { debts: [], summaries: new Map(), loading: true, error: null };
const EMPTY: DebtBookState = { ...INITIAL, loading: false };
const useDebtBookStore = create<DebtBookState>(() => INITIAL);

// One live subscription shared by every screen showing debts (debt book,
// customer list, map sheet, customer details), started by the first of them
// and stopped when the last one unmounts.
let holders = 0;
let stopSubscription: (() => void) | undefined;

function retainSubscription() {
  holders += 1;
  if (holders === 1) {
    useDebtBookStore.setState(INITIAL);
    try {
      stopSubscription = debtRepository.subscribeToDebts(
        (debts) => useDebtBookStore.setState({ debts, summaries: summarizeByCustomer(debts), loading: false, error: null }),
        (error) => useDebtBookStore.setState({ loading: false, error: formatError(error).message }),
      );
    } catch (error) {
      // No backend configured / signed out: show it instead of crashing.
      useDebtBookStore.setState({ loading: false, error: formatError(error).message });
    }
  }

  return () => {
    holders -= 1;
    if (holders === 0) {
      stopSubscription?.();
      stopSubscription = undefined;
      useDebtBookStore.setState(INITIAL);
    }
  };
}

// The account's debts, live. Drivers have no debt book (RLS would return
// nothing anyway), so for them this never subscribes and stays empty.
export function useDebtBook() {
  const currentUser = useCurrentUser();
  const enabled = canAccessFullApp(currentUser);
  const userId = currentUser?.uid ?? null;
  const state = useDebtBookStore();

  useEffect(() => {
    if (!enabled || !userId) return;
    return retainSubscription();
  }, [enabled, userId]);

  return enabled ? state : EMPTY;
}

// The green/red box's data for one customer: null while there is nothing
// reliable to show (drivers, still loading, load failed) — never a
// premature "paid". A customer without any debt counts as paid.
export function useCustomerDebtStatus(customerId: string): CustomerDebtSummary | null {
  const currentUser = useCurrentUser();
  const { summaries, loading, error } = useDebtBook();
  if (!canAccessFullApp(currentUser) || loading || error) return null;
  return summaries.get(customerId) ?? NO_DEBT;
}

const NO_DEBT: CustomerDebtSummary = { balance: 0, note: null };

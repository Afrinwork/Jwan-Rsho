import { useCallback, useMemo, useState } from "react";

import { useDebtBook } from "@/src/features/debts/hooks/useDebtBook";
import { summarizeDebts } from "@/src/features/debts/services/debtFormat";
import { debtRepository } from "@/src/repositories/debtRepository";
import { DebtInput, DebtPaymentInput } from "@/src/types/debt";
import { formatError } from "@/src/utils/formatError";

// The debt book screen: live debts (optionally of one customer) plus every
// write action. Changes made on the other phone (owner and secretary share
// the login) show up right away through the shared subscription.
export function useDebts(customerId: string | null = null) {
  const book = useDebtBook();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Every write reports success so the caller can close its form/sheet;
  // the list itself refreshes through the subscription.
  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      return true;
    } catch (writeError) {
      setActionError(formatError(writeError).message);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const debts = useMemo(
    () => (customerId ? book.debts.filter((debt) => debt.customerId === customerId) : book.debts),
    [book.debts, customerId],
  );
  const summary = useMemo(() => summarizeDebts(debts), [debts]);

  return {
    ...summary,
    loading: book.loading,
    error: book.error,
    actionError,
    busy,
    clearActionError: () => setActionError(null),
    create: (input: DebtInput) => run(() => debtRepository.createDebt(input)),
    update: (id: string, input: DebtInput) => run(() => debtRepository.updateDebt(id, input)),
    remove: (id: string) => run(() => debtRepository.deleteDebt(id)),
    addPayment: (debtId: string, input: DebtPaymentInput) => run(() => debtRepository.addPayment(debtId, input)),
    updatePayment: (id: string, input: DebtPaymentInput) => run(() => debtRepository.updatePayment(id, input)),
    removePayment: (id: string) => run(() => debtRepository.deletePayment(id)),
  };
}

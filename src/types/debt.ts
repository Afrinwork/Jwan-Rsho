// One payment towards a debt (partial or full).
export type DebtPayment = {
  id: string;
  amount: number;
  // Calendar day it was paid, "YYYY-MM-DD".
  paidOn: string;
  createdAt: string;
};

// One entry in the debt book (see supabase/migrations/..._debts.sql and
// ..._debt_payments.sql).
export type Debt = {
  id: string;
  // The customer it belongs to; null for a free-text name (someone who
  // isn't in the customer list, or the customer was deleted since).
  customerId: string | null;
  customerName: string;
  amount: number;
  // Calendar day the debt was recorded for, "YYYY-MM-DD".
  since: string;
  note: string | null;
  createdAt: string;
  // Newest first.
  payments: DebtPayment[];
  paidTotal: number;
  // amount - paidTotal, never below 0; 0 = fully paid.
  balance: number;
};

export type DebtInput = {
  customerId: string | null;
  customerName: string;
  amount: number;
  since: string;
  note: string | null;
};

export type DebtPaymentInput = {
  amount: number;
  paidOn: string;
};

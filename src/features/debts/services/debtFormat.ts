import { Debt, DebtPayment } from "@/src/types/debt";

// Typed amounts like "85", "85,50", "85.5" or "85 €" -> 85.5; null when it
// isn't a positive amount with at most two decimals. Thousands separators
// are not accepted on purpose: "1.200" is ambiguous (1,2 or 1200?).
export function parseDebtAmount(text: string): number | null {
  const cleaned = text.replace(/[€\s]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return value > 0 && value < 10_000_000 ? value : null;
}

// "235 €", "85,50 €" — whole euros without decimals, like the owner's notes.
export function formatEuro(amount: number) {
  const rounded = Math.round(amount * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(".", ",");
  return `${text} €`;
}

// Same value as the edit field shows it ("85,5" stays "85,50").
export function amountInputText(amount: number) {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(".", ",");
}

// Local calendar day as "YYYY-MM-DD" (the `since` column).
export function toDayString(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// "14.10.2026" or "2026-10-14" -> "2026-10-14"; null if it isn't a real day.
export function parseDayInput(text: string): string | null {
  const trimmed = text.trim();
  const german = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  const [year, month, day] = german
    ? [Number(german[3]), Number(german[2]), Number(german[1])]
    : iso
      ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
      : [NaN, NaN, NaN];
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return toDayString(date);
}

// "2026-10-14" -> "14.10.2026" (shown small under the name).
export function formatDay(day: string) {
  const [year, month, date] = day.split("-");
  return year && month && date ? `${date}.${month}.${year}` : day;
}

// Money is added up in cents so 0.1 + 0.2 style float noise never shows up.
const toCents = (amount: number) => Math.round(amount * 100);
const sumAmounts = (amounts: number[]) => amounts.reduce((sum, amount) => sum + toCents(amount), 0) / 100;

type DebtBase = Omit<Debt, "payments" | "paidTotal" | "balance">;

// Attaches each debt's payments and works out what is still open.
export function withPayments(debts: DebtBase[], payments: (DebtPayment & { debtId: string })[]): Debt[] {
  const byDebt = new Map<string, DebtPayment[]>();
  for (const { debtId, ...payment } of payments) {
    byDebt.set(debtId, [...(byDebt.get(debtId) ?? []), payment]);
  }
  return debts.map((debt) => {
    const own = (byDebt.get(debt.id) ?? []).sort(
      (left, right) => right.paidOn.localeCompare(left.paidOn) || right.createdAt.localeCompare(left.createdAt),
    );
    const paidTotal = sumAmounts(own.map((payment) => payment.amount));
    return { ...debt, payments: own, paidTotal, balance: Math.max(0, (toCents(debt.amount) - toCents(paidTotal)) / 100) };
  });
}

export function summarizeDebts(debts: Debt[]) {
  const open = debts.filter((debt) => debt.balance > 0).sort((left, right) => left.since.localeCompare(right.since));
  // Fully paid: most recently paid first.
  const paid = debts
    .filter((debt) => debt.balance <= 0)
    .sort((left, right) => (right.payments[0]?.paidOn ?? "").localeCompare(left.payments[0]?.paidOn ?? ""));
  return { open, paid, openTotal: sumAmounts(open.map((debt) => debt.balance)) };
}

export type CustomerDebtSummary = {
  // Still owed across all of the customer's debts; 0 = everything paid.
  balance: number;
  // Note of the newest debt that has one.
  note: string | null;
};

// What the green/red box next to a customer shows (customer list, map, trip).
export function summarizeByCustomer(debts: Debt[]): Map<string, CustomerDebtSummary> {
  const byCustomer = new Map<string, Debt[]>();
  for (const debt of debts) {
    if (debt.customerId) byCustomer.set(debt.customerId, [...(byCustomer.get(debt.customerId) ?? []), debt]);
  }
  return new Map(
    [...byCustomer].map(([customerId, own]) => {
      const newestFirst = [...own].sort((left, right) => right.since.localeCompare(left.since) || right.createdAt.localeCompare(left.createdAt));
      return [
        customerId,
        { balance: sumAmounts(own.map((debt) => debt.balance)), note: newestFirst.find((debt) => debt.note)?.note ?? null },
      ];
    }),
  );
}

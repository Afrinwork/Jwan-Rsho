import test from "node:test";
import assert from "node:assert/strict";

import {
  amountInputText,
  formatDay,
  formatEuro,
  parseDayInput,
  parseDebtAmount,
  summarizeByCustomer,
  summarizeDebts,
  withPayments,
} from "@/src/features/debts/services/debtFormat";

test("parseDebtAmount accepts the ways amounts get typed", () => {
  assert.equal(parseDebtAmount("235"), 235);
  assert.equal(parseDebtAmount("85,50"), 85.5);
  assert.equal(parseDebtAmount("85.5"), 85.5);
  assert.equal(parseDebtAmount(" 70 € "), 70);
});

test("parseDebtAmount rejects empty, zero, negative, ambiguous and too precise amounts", () => {
  for (const text of ["", "0", "-5", "abc", "1.200,50", "12,345", "€"]) {
    assert.equal(parseDebtAmount(text), null, text);
  }
});

test("formatEuro shows whole euros plainly and cents with a comma", () => {
  assert.equal(formatEuro(235), "235 €");
  assert.equal(formatEuro(85.5), "85,50 €");
  assert.equal(formatEuro(0.1 + 0.2), "0,30 €");
  assert.equal(amountInputText(85.5), "85,50");
  assert.equal(amountInputText(70), "70");
});

test("parseDayInput reads German and ISO dates and rejects impossible days", () => {
  assert.equal(parseDayInput("14.10.2026"), "2026-10-14");
  assert.equal(parseDayInput("1.2.2026"), "2026-02-01");
  assert.equal(parseDayInput("2026-10-14"), "2026-10-14");
  assert.equal(parseDayInput("31.02.2026"), null);
  assert.equal(parseDayInput("morgen"), null);
  assert.equal(formatDay("2026-10-14"), "14.10.2026");
});

type Payment = { debtId: string; amount: number; paidOn: string };

function base(id: string, amount: number, since: string, customerId: string | null = null, note: string | null = null) {
  return { id, customerId, customerName: id, amount, since, note, createdAt: since };
}

function pay(debtId: string, amount: number, paidOn: string): Payment & { id: string; createdAt: string } {
  return { debtId, amount, paidOn, id: `${debtId}-${paidOn}-${amount}`, createdAt: paidOn };
}

test("withPayments adds up partial payments and never goes below zero", () => {
  const [debt, overpaid] = withPayments(
    [base("Juan Rasho", 235, "2026-09-01"), base("Over", 50, "2026-09-01")],
    [pay("Juan Rasho", 100, "2026-09-10"), pay("Juan Rasho", 35.5, "2026-10-01"), pay("Over", 80, "2026-10-01")],
  );
  assert.equal(debt.paidTotal, 135.5);
  assert.equal(debt.balance, 99.5);
  assert.deepEqual(debt.payments.map((payment) => payment.paidOn), ["2026-10-01", "2026-09-10"]);
  assert.equal(overpaid.balance, 0);
});

test("summarizeDebts totals what is still open, oldest first, fully paid ones newest first", () => {
  const { open, paid, openTotal } = summarizeDebts(
    withPayments(
      [
        base("Ahmad Ali", 300, "2026-10-10"),
        base("Juan Rasho", 235, "2026-09-01"),
        base("Hamode Afrin", 65, "2026-10-01"),
        base("Paid early", 50, "2026-08-01"),
        base("Paid late", 20, "2026-08-05"),
      ],
      [pay("Ahmad Ali", 100, "2026-10-11"), pay("Paid early", 50, "2026-09-02"), pay("Paid late", 20, "2026-10-02")],
    ),
  );
  assert.deepEqual(open.map((entry) => entry.id), ["Juan Rasho", "Hamode Afrin", "Ahmad Ali"]);
  assert.equal(openTotal, 500);
  assert.deepEqual(paid.map((entry) => entry.id), ["Paid late", "Paid early"]);
});

test("summarizeByCustomer adds up a customer's debts and keeps the newest note", () => {
  const summary = summarizeByCustomer(
    withPayments(
      [
        base("old", 100, "2026-08-01", "c1", "alte Notiz"),
        base("new", 40, "2026-10-01", "c1", "zahlt nach dem 15."),
        base("paid", 30, "2026-09-01", "c2", null),
        base("free text", 70, "2026-09-01", null),
      ],
      [pay("old", 60, "2026-09-01"), pay("paid", 30, "2026-09-05")],
    ),
  );
  assert.deepEqual(summary.get("c1"), { balance: 80, note: "zahlt nach dem 15." });
  assert.deepEqual(summary.get("c2"), { balance: 0, note: null });
  assert.equal(summary.size, 2);
});

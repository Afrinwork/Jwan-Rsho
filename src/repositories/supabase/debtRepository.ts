import { withPayments } from "@/src/features/debts/services/debtFormat";
import { requireCurrentUserId, requireSupabase } from "@/src/repositories/supabase/repositoryContext";
import { Debt, DebtInput, DebtPaymentInput } from "@/src/types/debt";
import { generateUuid } from "@/src/utils/uuid";

type DebtRow = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  amount: number | string;
  since: string;
  note: string | null;
  created_at: string;
};

type PaymentRow = {
  id: string;
  debt_id: string;
  amount: number | string;
  paid_on: string;
  created_at: string;
};

function toColumns(input: DebtInput) {
  return {
    customer_id: input.customerId,
    customer_name: input.customerName.trim(),
    amount: input.amount,
    since: input.since,
    note: input.note?.trim() || null,
  };
}

// The debt book of the signed-in account (owner_id = own uid; RLS keeps
// drivers and every other account out). Payments are only bookkeeping —
// who paid how much when — no money moves through the app.
export const debtRepository = {
  subscribeToDebts(onChange: (debts: Debt[]) => void, onError: (error: unknown) => void) {
    const client = requireSupabase();
    const ownerId = requireCurrentUserId();
    let latestRequest = 0;

    const fetchAndEmit = async () => {
      const requestId = ++latestRequest;
      const [debts, payments] = await Promise.all([
        client.from("debts").select("id, customer_id, customer_name, amount, since, note, created_at").eq("owner_id", ownerId),
        client.from("debt_payments").select("id, debt_id, amount, paid_on, created_at").eq("owner_id", ownerId),
      ]);
      // An older fetch finishing late must not overwrite a newer one.
      if (requestId !== latestRequest) return;
      const error = debts.error ?? payments.error;
      if (error) {
        onError(error);
        return;
      }
      onChange(
        withPayments(
          (debts.data as DebtRow[]).map((row) => ({
            id: row.id,
            customerId: row.customer_id,
            customerName: row.customer_name,
            // numeric columns can arrive as strings from PostgREST.
            amount: Number(row.amount),
            since: row.since,
            note: row.note,
            createdAt: row.created_at,
          })),
          (payments.data as PaymentRow[]).map((row) => ({
            id: row.id,
            debtId: row.debt_id,
            amount: Number(row.amount),
            paidOn: row.paid_on,
            createdAt: row.created_at,
          })),
        ),
      );
    };

    void fetchAndEmit();

    // Unique topic per subscription -- see driverCheckInRepository for why.
    const filter = `owner_id=eq.${ownerId}`;
    const channel = client
      .channel(`debts:${ownerId}:${generateUuid()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "debts", filter }, () => void fetchAndEmit())
      .on("postgres_changes", { event: "*", schema: "public", table: "debt_payments", filter }, () => void fetchAndEmit())
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  },

  async createDebt(input: DebtInput) {
    const userId = requireCurrentUserId();
    const { error } = await requireSupabase()
      .from("debts")
      .insert({ ...toColumns(input), owner_id: userId, created_by: userId });
    if (error) throw error;
  },

  async updateDebt(id: string, input: DebtInput) {
    const { error } = await requireSupabase().from("debts").update(toColumns(input)).eq("id", id);
    if (error) throw error;
  },

  async deleteDebt(id: string) {
    const { error } = await requireSupabase().from("debts").delete().eq("id", id);
    if (error) throw error;
  },

  async addPayment(debtId: string, input: DebtPaymentInput) {
    const userId = requireCurrentUserId();
    const { error } = await requireSupabase()
      .from("debt_payments")
      .insert({ debt_id: debtId, owner_id: userId, created_by: userId, amount: input.amount, paid_on: input.paidOn });
    if (error) throw error;
  },

  async updatePayment(id: string, input: DebtPaymentInput) {
    const { error } = await requireSupabase()
      .from("debt_payments")
      .update({ amount: input.amount, paid_on: input.paidOn })
      .eq("id", id);
    if (error) throw error;
  },

  async deletePayment(id: string) {
    const { error } = await requireSupabase().from("debt_payments").delete().eq("id", id);
    if (error) throw error;
  },
};

import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { searchCustomers } from "@/src/features/debts/hooks/useCustomerDirectory";
import {
  amountInputText,
  formatDay,
  formatEuro,
  parseDayInput,
  parseDebtAmount,
  toDayString,
} from "@/src/features/debts/services/debtFormat";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { spacing } from "@/src/theme/spacing";
import { Customer } from "@/src/types/customer";
import { Debt, DebtInput, DebtPayment, DebtPaymentInput } from "@/src/types/debt";
import { formatAddress } from "@/src/utils/formatAddress";

type DebtSheetProps = {
  // A tapped debt (actions first), or "new" for the add form.
  target: Debt | "new";
  // New debt opened from a customer's own debt page: already picked.
  presetCustomer?: Customer | null;
  customers: Customer[];
  customerById: Map<string, Customer>;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: DebtInput) => void;
  onDelete: () => void;
  onAddPayment: (input: DebtPaymentInput) => void;
  onUpdatePayment: (paymentId: string, input: DebtPaymentInput) => void;
  onDeletePayment: (paymentId: string) => void;
};

type Mode = "actions" | "edit" | "confirmDelete" | "payment";

// One sheet for everything about a debt — actions, edit form, payments,
// delete confirmation — switching content instead of opening a second Modal
// on top (iOS can't show one Modal over another and froze the screen).
// Keyed by the caller, so each opening starts fresh.
export function DebtSheet(props: DebtSheetProps) {
  const { t } = useTranslation("debts");
  const colors = useThemeColors();
  const debt = props.target === "new" ? null : props.target;
  const [mode, setMode] = useState<Mode>(debt ? "actions" : "edit");

  // Debt form.
  const initialCustomer = debt?.customerId ? props.customerById.get(debt.customerId) ?? null : props.presetCustomer ?? null;
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [name, setName] = useState(debt?.customerName ?? initialCustomer?.fullName ?? "");
  const [amountText, setAmountText] = useState(debt ? amountInputText(debt.amount) : "");
  const [dayText, setDayText] = useState(formatDay(debt?.since ?? toDayString(new Date())));
  const [note, setNote] = useState(debt?.note ?? "");
  const [showErrors, setShowErrors] = useState(false);

  // Payment form (new payment, or editing one of the list).
  const [payment, setPayment] = useState<DebtPayment | null>(null);
  const [payAmountText, setPayAmountText] = useState("");
  const [payDayText, setPayDayText] = useState("");
  const [confirmPaymentDelete, setConfirmPaymentDelete] = useState(false);

  const amount = parseDebtAmount(amountText);
  const since = parseDayInput(dayText);
  const nameValid = name.trim().length > 0;
  const suggestions = customer ? [] : searchCustomers(props.customers, name);
  const linkedCustomer = debt?.customerId ? props.customerById.get(debt.customerId) ?? null : null;

  const payAmount = parseDebtAmount(payAmountText);
  const payDay = parseDayInput(payDayText);

  function save() {
    if (!nameValid || amount === null || since === null) {
      setShowErrors(true);
      return;
    }
    props.onSave({
      customerId: customer?.id ?? null,
      customerName: customer?.fullName ?? name,
      amount,
      since,
      note: note.trim() || null,
    });
  }

  function openPayment(existing: DebtPayment | null) {
    setPayment(existing);
    setPayAmountText(existing ? amountInputText(existing.amount) : debt ? amountInputText(debt.balance) : "");
    setPayDayText(formatDay(existing?.paidOn ?? toDayString(new Date())));
    setConfirmPaymentDelete(false);
    setShowErrors(false);
    setMode("payment");
  }

  function savePayment() {
    if (payAmount === null || payDay === null) {
      setShowErrors(true);
      return;
    }
    const input = { amount: payAmount, paidOn: payDay };
    if (payment) props.onUpdatePayment(payment.id, input);
    else props.onAddPayment(input);
  }

  const errorBox = props.error ? <ErrorState message={props.error} /> : null;

  return (
    <Modal animationType="slide" onRequestClose={props.onClose} transparent visible>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <Pressable accessibilityLabel={t("close")} onPress={props.onClose} style={styles.backdrop} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {mode === "actions" && debt ? (
              <>
                <AppText variant="heading">{debt.customerName}</AppText>
                {linkedCustomer ? <CustomerInfo customer={linkedCustomer} /> : null}
                <View style={[styles.figures, { borderColor: colors.border }]}>
                  <Figure label={t("amount")} value={formatEuro(debt.amount)} />
                  <Figure color="success" label={t("paidTotal")} value={formatEuro(debt.paidTotal)} />
                  <Figure color={debt.balance > 0 ? "danger" : "success"} label={t("balance")} value={formatEuro(debt.balance)} />
                </View>
                <AppText color="muted" variant="caption">
                  {t("since", { date: formatDay(debt.since) })}
                </AppText>
                {debt.note ? (
                  <View style={[styles.noteBox, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                    <AppText color="muted" variant="caption">
                      {`📝 ${t("note")}`}
                    </AppText>
                    <AppText variant="body">{debt.note}</AppText>
                  </View>
                ) : null}
                {errorBox}
                {debt.balance > 0 ? (
                  <View style={styles.row}>
                    <View style={styles.flex}>
                      <AppButton label={t("addPayment")} onPress={() => openPayment(null)} variant="secondary" />
                    </View>
                    <View style={styles.flex}>
                      <AppButton
                        label={t("payRest")}
                        loading={props.busy}
                        onPress={() => props.onAddPayment({ amount: debt.balance, paidOn: toDayString(new Date()) })}
                        variant="success"
                      />
                    </View>
                  </View>
                ) : null}

                {debt.payments.length ? (
                  <View style={styles.payments}>
                    <AppText color="muted" variant="label">
                      {t("paymentsTitle", { count: debt.payments.length })}
                    </AppText>
                    {debt.payments.map((entry) => (
                      <Pressable
                        accessibilityHint={t("paymentEditHint")}
                        accessibilityRole="button"
                        key={entry.id}
                        onPress={() => openPayment(entry)}
                        style={[styles.paymentRow, { borderColor: colors.border }]}
                      >
                        <AppText style={styles.flex} variant="body">
                          {`✅ ${formatDay(entry.paidOn)}`}
                        </AppText>
                        <AppText color="success" variant="bodyMedium">
                          {formatEuro(entry.amount)}
                        </AppText>
                        <AppText color="muted" variant="caption">
                          ✎
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                <AppButton label={t("editOrNote")} onPress={() => setMode("edit")} variant="secondary" />
                <AppButton label={t("delete")} onPress={() => setMode("confirmDelete")} variant="danger" />
                <AppButton label={t("close")} onPress={props.onClose} variant="secondary" />
              </>
            ) : null}

            {mode === "payment" && debt ? (
              <>
                <AppText variant="heading">{payment ? t("editPaymentTitle") : t("addPaymentTitle")}</AppText>
                <AppText color="muted" variant="caption">
                  {`${debt.customerName} · ${t("balance")}: ${formatEuro(debt.balance)}`}
                </AppText>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <AppText color="muted" variant="label">
                      {t("fields.paymentAmount")}
                    </AppText>
                    <AppInput autoFocus keyboardType="decimal-pad" onChangeText={setPayAmountText} placeholder="0" value={payAmountText} />
                  </View>
                  <View style={styles.flex}>
                    <AppText color="muted" variant="label">
                      {t("fields.paidOn")}
                    </AppText>
                    <AppInput keyboardType="numbers-and-punctuation" onChangeText={setPayDayText} placeholder="14.10.2026" value={payDayText} />
                  </View>
                </View>
                {showErrors && payAmount === null ? <AppText color="danger" variant="caption">{t("errors.amount")}</AppText> : null}
                {showErrors && payDay === null ? <AppText color="danger" variant="caption">{t("errors.since")}</AppText> : null}
                {errorBox}
                {confirmPaymentDelete && payment ? (
                  <>
                    <AppText variant="body">{t("deletePaymentMessage", { amount: formatEuro(payment.amount), date: formatDay(payment.paidOn) })}</AppText>
                    <AppButton label={t("deleteConfirm")} loading={props.busy} onPress={() => props.onDeletePayment(payment.id)} variant="danger" />
                    <AppButton label={t("cancel")} onPress={() => setConfirmPaymentDelete(false)} variant="secondary" />
                  </>
                ) : (
                  <>
                    <AppButton label={t("save")} loading={props.busy} onPress={savePayment} />
                    {payment ? <AppButton label={t("deletePayment")} onPress={() => setConfirmPaymentDelete(true)} variant="danger" /> : null}
                    <AppButton label={t("cancel")} onPress={() => setMode("actions")} variant="secondary" />
                  </>
                )}
              </>
            ) : null}

            {mode === "confirmDelete" && debt ? (
              <>
                <AppText variant="heading">{t("deleteTitle")}</AppText>
                <AppText color="muted" variant="body">
                  {t("deleteMessage", { name: debt.customerName, amount: formatEuro(debt.amount) })}
                </AppText>
                {errorBox}
                <AppButton label={t("deleteConfirm")} loading={props.busy} onPress={props.onDelete} variant="danger" />
                <AppButton label={t("cancel")} onPress={() => setMode("actions")} variant="secondary" />
              </>
            ) : null}

            {mode === "edit" ? (
              <>
                <AppText variant="heading">{debt ? t("editTitle") : t("addTitle")}</AppText>
                <AppText color="muted" variant="label">
                  {t("fields.customer")}
                </AppText>
                {customer ? (
                  <View style={[styles.pickedCustomer, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                    <View style={styles.flex}>
                      <AppText variant="bodyMedium">{customer.fullName}</AppText>
                      <CustomerInfo customer={customer} />
                    </View>
                    <Pressable
                      accessibilityLabel={t("changeCustomer")}
                      hitSlop={8}
                      onPress={() => {
                        setCustomer(null);
                        setName("");
                      }}
                    >
                      <AppText color="primary" variant="label">
                        {t("changeCustomer")}
                      </AppText>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <AppInput autoFocus={!debt} onChangeText={setName} placeholder={t("fields.customerSearch")} value={name} />
                    {suggestions.map((option) => (
                      <Pressable
                        accessibilityRole="button"
                        key={option.id}
                        onPress={() => {
                          setCustomer(option);
                          setName(option.fullName);
                        }}
                        style={[styles.suggestion, { borderColor: colors.border }]}
                      >
                        <AppText variant="bodyMedium">{option.fullName}</AppText>
                        <AppText color="muted" numberOfLines={1} variant="caption">
                          {[option.phone, formatAddress([option.address, option.city])].filter(Boolean).join(" · ")}
                        </AppText>
                      </Pressable>
                    ))}
                    {name.trim() && !suggestions.length ? (
                      <AppText color="muted" variant="caption">
                        {t("freeTextHint")}
                      </AppText>
                    ) : null}
                  </>
                )}
                {showErrors && !nameValid ? <AppText color="danger" variant="caption">{t("errors.name")}</AppText> : null}

                <View style={styles.row}>
                  <View style={styles.flex}>
                    <AppText color="muted" variant="label">
                      {t("fields.amount")}
                    </AppText>
                    <AppInput keyboardType="decimal-pad" onChangeText={setAmountText} placeholder="0" value={amountText} />
                  </View>
                  <View style={styles.flex}>
                    <AppText color="muted" variant="label">
                      {t("fields.since")}
                    </AppText>
                    <AppInput keyboardType="numbers-and-punctuation" onChangeText={setDayText} placeholder="14.10.2026" value={dayText} />
                  </View>
                </View>
                {showErrors && amount === null ? <AppText color="danger" variant="caption">{t("errors.amount")}</AppText> : null}
                {showErrors && since === null ? <AppText color="danger" variant="caption">{t("errors.since")}</AppText> : null}

                <AppText color="muted" variant="label">
                  {t("fields.note")}
                </AppText>
                <AppInput multiline onChangeText={setNote} placeholder={t("fields.notePlaceholder")} style={styles.noteInput} value={note} />
                {errorBox}
                <AppButton label={t("save")} loading={props.busy} onPress={save} />
                <AppButton label={t("cancel")} onPress={debt ? () => setMode("actions") : props.onClose} variant="secondary" />
              </>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CustomerInfo({ customer }: { customer: Customer }) {
  const address = formatAddress([customer.address, customer.city]);
  return (
    <>
      {customer.phone ? (
        <AppText color="muted" variant="caption">
          {`📞 ${customer.phone}`}
        </AppText>
      ) : null}
      {address ? (
        <AppText color="muted" variant="caption">
          {`📍 ${address}`}
        </AppText>
      ) : null}
    </>
  );
}

function Figure({ label, value, color }: { label: string; value: string; color?: "success" | "danger" }) {
  return (
    <View style={styles.figure}>
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
      <AppText color={color ?? "default"} variant="subheading">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  sheet: { maxHeight: "90%", borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  flex: { flex: 1, gap: spacing.xxs },
  row: { flexDirection: "row", gap: spacing.sm },
  figures: { flexDirection: "row", borderWidth: 1, borderRadius: 12, paddingVertical: spacing.sm },
  figure: { flex: 1, alignItems: "center", gap: 2 },
  noteBox: { borderWidth: 1, borderRadius: 12, padding: spacing.sm, gap: spacing.xxs },
  noteInput: { minHeight: 80, textAlignVertical: "top" },
  payments: { gap: spacing.xs },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.xs,
  },
  pickedCustomer: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderRadius: 12, padding: spacing.sm },
  suggestion: { borderWidth: 1, borderRadius: 12, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, gap: 2 },
});

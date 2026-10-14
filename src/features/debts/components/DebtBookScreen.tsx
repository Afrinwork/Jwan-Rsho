import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { DebtSheet } from "@/src/features/debts/components/DebtSheet";
import { useCustomerDirectory } from "@/src/features/debts/hooks/useCustomerDirectory";
import { useDebts } from "@/src/features/debts/hooks/useDebts";
import { formatDay, formatEuro } from "@/src/features/debts/services/debtFormat";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";
import { Debt } from "@/src/types/debt";
import { formatAddress } from "@/src/utils/formatAddress";

type DebtBookScreenProps = {
  // Set when opened from a customer's debt box: only that customer's debts.
  customerId?: string | null;
};

// Who still owes how much, since when, with the open total at the bottom.
// Tap a debt: payments (any number, editable), edit + note, delete.
export function DebtBookScreen(props: DebtBookScreenProps) {
  const { t } = useTranslation("debts");
  const colors = useThemeColors();
  const customerId = props.customerId ?? null;
  const debts = useDebts(customerId);
  const directory = useCustomerDirectory();
  const customer = customerId ? directory.byId.get(customerId) ?? null : null;
  const [sheetTarget, setSheetTarget] = useState<Debt | "new" | null>(null);
  const [showPaid, setShowPaid] = useState(Boolean(customerId));

  function openSheet(target: Debt | "new") {
    debts.clearActionError();
    setSheetTarget(target);
  }

  async function act(action: () => Promise<boolean>) {
    if (await action()) setSheetTarget(null);
  }

  if (debts.loading) return <LoadingView label={t("loading")} />;

  const sheetDebt = sheetTarget && sheetTarget !== "new" ? sheetTarget : null;
  const address = customer ? formatAddress([customer.address, customer.city]) : "";

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {customer ? (
          <View style={[styles.customerHeader, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <AppText variant="heading">{customer.fullName}</AppText>
            {customer.phone ? <AppText color="muted" variant="caption">{`📞 ${customer.phone}`}</AppText> : null}
            {address ? <AppText color="muted" variant="caption">{`📍 ${address}`}</AppText> : null}
          </View>
        ) : null}
        <AppButton label={t("add")} onPress={() => openSheet("new")} />
        {debts.error ? <ErrorState message={debts.error} /> : null}

        {debts.open.length === 0 && !debts.error ? (
          <EmptyState message={t(customerId ? "empty.customerMessage" : "empty.message")} title={t("empty.title")} />
        ) : null}
        {debts.open.map((debt) => (
          <DebtRow debt={debt} key={debt.id} onPress={() => openSheet(debt)} />
        ))}

        {debts.paid.length ? (
          <View style={styles.paidSection}>
            <Pressable accessibilityRole="button" onPress={() => setShowPaid((current) => !current)} style={styles.paidToggle}>
              <AppText color="muted" variant="label">
                {`${showPaid ? "▾" : "▸"} ${t("paidSection", { count: debts.paid.length })}`}
              </AppText>
            </Pressable>
            {showPaid ? debts.paid.map((debt) => <DebtRow debt={debt} key={debt.id} onPress={() => openSheet(debt)} />) : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.totalBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <AppText variant="subheading">{t("total")}</AppText>
        <AppText color={debts.openTotal > 0 ? "danger" : "success"} variant="heading">
          {formatEuro(debts.openTotal)}
        </AppText>
      </View>

      {sheetTarget ? (
        <DebtSheet
          busy={debts.busy}
          customerById={directory.byId}
          customers={directory.customers}
          error={debts.actionError}
          key={sheetDebt?.id ?? "new"}
          onAddPayment={(input) => sheetDebt && void act(() => debts.addPayment(sheetDebt.id, input))}
          onClose={() => setSheetTarget(null)}
          onDelete={() => sheetDebt && void act(() => debts.remove(sheetDebt.id))}
          onDeletePayment={(paymentId) => void act(() => debts.removePayment(paymentId))}
          onSave={(input) => void act(() => (sheetDebt ? debts.update(sheetDebt.id, input) : debts.create(input)))}
          onUpdatePayment={(paymentId, input) => void act(() => debts.updatePayment(paymentId, input))}
          presetCustomer={customer}
          target={sheetTarget}
        />
      ) : null}
    </ScreenContainer>
  );
}

function DebtRow({ debt, onPress }: { debt: Debt; onPress: () => void }) {
  const { t } = useTranslation("debts");
  const colors = useThemeColors();
  const paid = debt.balance <= 0;
  const details = [
    t("since", { date: formatDay(debt.since) }),
    debt.paidTotal > 0 && !paid ? t("partlyPaid", { paid: formatEuro(debt.paidTotal), amount: formatEuro(debt.amount) }) : null,
    debt.note ? `📝 ${debt.note}` : null,
  ].filter(Boolean);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: pressed ? 0.7 : paid ? 0.65 : 1 },
      ]}
    >
      <View style={styles.rowText}>
        <AppText numberOfLines={1} variant="bodyMedium">
          {paid ? `✅ ${debt.customerName}` : debt.customerName}
        </AppText>
        <AppText color="muted" numberOfLines={2} variant="caption">
          {details.join("  ·  ")}
        </AppText>
      </View>
      <AppText color={paid ? "success" : "danger"} variant="subheading">
        {paid ? formatEuro(debt.amount) : formatEuro(debt.balance)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 0 },
  content: { gap: spacing.sm, paddingBottom: spacing.xl },
  customerHeader: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowText: { flex: 1, gap: 2 },
  paidSection: { gap: spacing.sm, marginTop: spacing.sm },
  paidToggle: { paddingVertical: spacing.xs },
  totalBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});

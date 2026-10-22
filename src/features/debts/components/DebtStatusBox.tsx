import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/src/components/ui/AppText";
import { routes } from "@/src/constants/routes";
import { useCustomerDebtStatus } from "@/src/features/debts/hooks/useDebtBook";
import { formatEuro } from "@/src/features/debts/services/debtFormat";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type DebtStatusBoxProps = {
  customerId: string;
  // Called instead of navigating straight away — e.g. a sheet in a Modal
  // has to close first, or the Modal would stay on top of the debt page.
  onOpen?: (open: () => void) => void;
};

// Red "balance X €" with the debt note, wherever a customer is shown — only
// for a customer who still owes something; a paid-up customer (or one
// without any debt) gets no box at all. Renders nothing for drivers (no debt
// book) or while loading. Tap: that customer's debts.
export function DebtStatusBox(props: DebtStatusBoxProps) {
  const { t } = useTranslation("debts");
  const colors = useThemeColors();
  const router = useRouter();
  const summary = useCustomerDebtStatus(props.customerId);
  if (!summary || summary.balance <= 0) return null;

  const openDebts = () => router.push({ pathname: routes.managementDebts, params: { customerId: props.customerId } });

  return (
    <Pressable
      accessibilityHint={t("box.hint")}
      accessibilityRole="button"
      onPress={() => (props.onOpen ? props.onOpen(openDebts) : openDebts())}
      style={({ pressed }) => [
        styles.box,
        {
          backgroundColor: colors.dangerBackground,
          borderColor: colors.dangerBorder,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <AppText color="danger" variant="bodyMedium">
        {t("box.balance", { amount: formatEuro(summary.balance) })}
      </AppText>
      {summary.note ? (
        <AppText color="muted" numberOfLines={2} variant="caption">
          {`📝 ${summary.note}`}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, gap: 2 },
});

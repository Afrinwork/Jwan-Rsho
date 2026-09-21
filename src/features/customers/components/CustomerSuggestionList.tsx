import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

import { CustomerMatch } from "@/src/features/customers/hooks/useDuplicateCustomerCheck";
import { CustomerSearchResult } from "@/src/features/customers/components/CustomerSearchResult";
import { Customer } from "@/src/types/customer";

type CustomerSuggestionListProps = {
  matches: CustomerMatch[];
  onSelect: (customer: Customer) => void;
};

// Live suggestions shown under the name field as the user types — picking
// one fills the whole form from that customer instead of typing it again.
export function CustomerSuggestionList({ matches, onSelect }: CustomerSuggestionListProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("customers");

  if (!matches.length) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.primaryMuted, borderColor: colors.border }]}>
      <AppText color="primary" variant="label">
        {t("suggestions.title")}
      </AppText>
      <AppText color="muted" variant="caption">
        {t("suggestions.subtitle")}
      </AppText>
      <View style={styles.results}>
        {matches.map((match) => (
          <CustomerSearchResult customer={match.customer} key={match.customer.id} onPress={() => onSelect(match.customer)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  results: {
    gap: spacing.xs,
    marginTop: 2,
  },
});

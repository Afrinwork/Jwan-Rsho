import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppBadge } from "@/src/components/ui/AppBadge";
import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

import { CustomerMatch } from "@/src/features/customers/hooks/useDuplicateCustomerCheck";
import { CustomerSearchResult } from "@/src/features/customers/components/CustomerSearchResult";
import { Customer } from "@/src/types/customer";

type DuplicateCustomerBannerProps = {
  matches: CustomerMatch[];
  onSelect: (customer: Customer) => void;
};

// Suggestion list shown live under the new-customer fields (name/phone/
// address), styled like a warning callout so it reads as "check before you
// create a duplicate" rather than a neutral search result.
export function DuplicateCustomerBanner({ matches, onSelect }: DuplicateCustomerBannerProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("customers");

  if (!matches.length) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.warningBackground, borderColor: colors.warningBorder }]}>
      <AppBadge label={t("duplicateCheck.title")} tone="warning" />
      <AppText color="muted" variant="caption">
        {t("duplicateCheck.subtitle")}
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

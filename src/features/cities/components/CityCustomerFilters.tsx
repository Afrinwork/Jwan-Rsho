import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppInput } from "@/src/components/ui/AppInput";
import { spacing } from "@/src/theme/spacing";

type CityCustomerFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
};

export function CityCustomerFilters(props: CityCustomerFiltersProps) {
  const { t } = useTranslation("cities");

  return (
    <AppCard contentStyle={styles.container}>
      <AppInput
        onChangeText={props.onSearchTermChange}
        placeholder={t("customerFilters.searchPlaceholder")}
        style={styles.searchInput}
        value={props.searchTerm}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  searchInput: {
    paddingVertical: 11,
  },
});

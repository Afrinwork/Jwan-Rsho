import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppInput } from "@/src/components/ui/AppInput";
import { spacing } from "@/src/theme/spacing";

type CityCustomerFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
};

export function CityCustomerFilters(props: CityCustomerFiltersProps) {
  const { t } = useTranslation("cities");

  return (
    <View style={styles.container}>
      <AppInput
        onChangeText={props.onSearchTermChange}
        placeholder={t("customerFilters.searchPlaceholder")}
        style={styles.searchInput}
        value={props.searchTerm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  searchInput: {
    paddingVertical: 11,
  },
});

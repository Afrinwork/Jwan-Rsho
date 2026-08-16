import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppInput } from "@/src/components/ui/AppInput";
import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type CityCustomerFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
};

export function CityCustomerFilters(props: CityCustomerFiltersProps) {
  const { t } = useTranslation("cities");
  const colors = useThemeColors();
  const options = [
    { label: t("customerFilters.all"), value: "all" },
    { label: t("customerFilters.open"), value: "open" },
    { label: t("customerFilters.completed"), value: "completed" },
    { label: t("customerFilters.noOpenOrder"), value: "no-open-order" },
  ];

  return (
    <View style={styles.container}>
      <AppInput
        onChangeText={props.onSearchTermChange}
        placeholder={t("customerFilters.searchPlaceholder")}
        style={styles.searchInput}
        value={props.searchTerm}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {options.map((value) => (
            <Pressable
              key={value.value}
              onPress={() => props.onStatusChange(value.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: props.selectedStatus === value.value ? colors.primary : colors.surface,
                  borderColor: props.selectedStatus === value.value ? colors.primary : colors.border,
                },
              ]}
            >
              <AppText
                color={props.selectedStatus === value.value ? colors.primaryContrast : "default"}
                style={styles.label}
                variant="caption"
              >
                {value.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  searchInput: {
    paddingVertical: 11,
  },
  row: { flexDirection: "row", gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  label: {
    fontWeight: "700",
  },
});

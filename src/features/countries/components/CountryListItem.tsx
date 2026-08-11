import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Country } from "@/src/types/country";

type CountryListItemProps = {
  country: Country;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete?: () => void;
};

export function CountryListItem({ country, onEdit, onToggleActive, onDelete }: CountryListItemProps) {
  const { t } = useTranslation("countries");
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, shadowColor: colors.shadow }]}>
      <View style={styles.topRow}>
        <View style={styles.text}>
          <Text numberOfLines={2} style={[styles.name, { color: colors.text }, !country.isActive && { color: colors.mutedText }]}>
            {country.name}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedText }]}>
            {(country.isoCode || t("listItem.noIsoCode"))} · {t("listItem.sortOrder", { order: country.sortOrder })}
          </Text>
        </View>
        <Switch onValueChange={onToggleActive} trackColor={{ true: colors.primary }} value={country.isActive} />
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onEdit}><Text style={[styles.edit, { color: colors.primary }]}>{t("common:edit")}</Text></Pressable>
        {onDelete ? <Pressable onPress={onDelete}><Text style={[styles.edit, { color: colors.danger }]}>{t("common:delete")}</Text></Pressable> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  text: { gap: 2, flex: 1 },
  name: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 13 },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  edit: { fontSize: 14, fontWeight: "600" },
});

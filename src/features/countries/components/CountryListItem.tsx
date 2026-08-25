import { Pressable, StyleSheet, Switch, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppBadge } from "@/src/components/ui/AppBadge";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Country } from "@/src/types/country";
import { getLocalizedName } from "@/src/utils/localizedName";

type CountryListItemProps = {
  country: Country;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete?: () => void;
};

export function CountryListItem({ country, onEdit, onToggleActive, onDelete }: CountryListItemProps) {
  const { t, i18n } = useTranslation("countries");
  const colors = useThemeColors();
  const isoCode = country.isoCode?.trim();

  return (
    <AppCard contentStyle={styles.card} style={{ shadowColor: colors.shadow }}>
      <View style={styles.topRow}>
        <View style={styles.text}>
          <AppText numberOfLines={2} style={[styles.name, !country.isActive && { color: colors.mutedText }]}>
            {getLocalizedName(country, i18n.language)}
          </AppText>
          <View style={styles.metaRow}>
            <AppBadge label={isoCode || t("listItem.noIsoCode")} tone="neutral" />
            <AppText color="muted" variant="caption">
              {t("listItem.sortOrder", { order: country.sortOrder })}
            </AppText>
          </View>
        </View>
        <Switch onValueChange={onToggleActive} trackColor={{ true: colors.primary }} value={country.isActive} />
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onEdit}>
          <AppText style={[styles.actionText, { color: colors.primary }]}>{t("common:edit")}</AppText>
        </Pressable>
        {onDelete ? (
          <Pressable onPress={onDelete}>
            <AppText style={[styles.actionText, { color: colors.danger }]}>{t("common:delete")}</AppText>
          </Pressable>
        ) : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  text: {
    gap: spacing.xxs,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

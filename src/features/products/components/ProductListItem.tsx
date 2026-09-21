import { ArrowCircleDown20Regular, ArrowCircleUp20Regular, Box20Regular } from "@fluentui/react-native-icons";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppBadge } from "@/src/components/ui/AppBadge";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { Product } from "@/src/types/product";
import { getLocalizedName } from "@/src/utils/localizedName";

type ProductListItemProps = {
  product: Product;
  onPress?: () => void;
  onToggleActive?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

export function ProductListItem(props: ProductListItemProps) {
  const colors = useThemeColors();
  const { t, i18n } = useTranslation("products");

  return (
    <Pressable
      disabled={!props.onPress}
      onPress={props.onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.thumbnail, { backgroundColor: colors.primaryMuted, borderColor: colors.border }]}>
          <Box20Regular color={colors.mutedText} />
        </View>
        <View style={styles.info}>
          <Text
            numberOfLines={2}
            style={[styles.name, { color: colors.text }, !props.product.isActive && { color: colors.textMuted }]}
          >
            {getLocalizedName(props.product, i18n.language)}
          </Text>
          <View style={styles.metaRow}>
            <AppBadge label={props.product.defaultUnit} tone="neutral" />
            <Text style={[styles.unit, { color: colors.textMuted }]}>
              {t("list.sortOrder", { order: props.product.sortOrder })}
            </Text>
          </View>
        </View>
        {props.onToggleActive ? (
          <Switch onValueChange={props.onToggleActive} trackColor={{ true: colors.primary }} value={props.product.isActive} />
        ) : null}
      </View>
      <View style={styles.actionsRow}>
        {props.onMoveUp ? (
          <Pressable onPress={props.onMoveUp} style={[styles.iconAction, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <ArrowCircleUp20Regular color={colors.primary} />
          </Pressable>
        ) : null}
        {props.onMoveDown ? (
          <Pressable onPress={props.onMoveDown} style={[styles.iconAction, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <ArrowCircleDown20Regular color={colors.primary} />
          </Pressable>
        ) : null}
        <View style={styles.spacer} />
        {props.onEdit ? (
          <Pressable onPress={props.onEdit} style={[styles.textAction, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Text style={[styles.action, { color: colors.primary }]}>{t("common:edit")}</Text>
          </Pressable>
        ) : null}
        {props.onDelete ? (
          <Pressable onPress={props.onDelete} style={[styles.textAction, { backgroundColor: colors.dangerBackground, borderColor: colors.dangerBorder }]}>
            <Text style={[styles.action, { color: colors.danger }]}>{t("common:delete")}</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 6,
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
  unit: {
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconAction: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: {
    flex: 1,
  },
  textAction: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  action: {
    fontSize: 14,
    fontWeight: "600",
  },
});

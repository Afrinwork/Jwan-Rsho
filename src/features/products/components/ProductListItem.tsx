import { ArrowCircleDown20Regular, ArrowCircleUp20Regular, Box20Regular } from "@fluentui/react-native-icons";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
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
      style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, shadowColor: colors.shadow }]}
    >
      <View style={styles.topRow}>
        <View style={[styles.thumbnail, { backgroundColor: colors.primaryMuted, borderColor: colors.border }]}>
          {props.product.emoji ? (
            <Text style={styles.thumbnailEmoji}>{props.product.emoji}</Text>
          ) : (
            <Box20Regular color={colors.primary} />
          )}
        </View>
        <View style={styles.info}>
          <Text
            numberOfLines={2}
            style={[styles.name, { color: colors.text }, !props.product.isActive && { color: colors.mutedText }]}
          >
            {getLocalizedName(props.product, i18n.language)}
          </Text>
          <Text style={[styles.unit, { color: colors.mutedText }]}>
            {props.product.defaultUnit} · {t("list.sortOrder", { order: props.product.sortOrder })}
          </Text>
        </View>
        {props.onToggleActive ? (
          <Switch onValueChange={props.onToggleActive} trackColor={{ true: colors.primary }} value={props.product.isActive} />
        ) : null}
      </View>
      <View style={styles.actionsRow}>
        {props.onMoveUp ? (
          <Pressable onPress={props.onMoveUp} style={styles.iconAction}>
            <ArrowCircleUp20Regular color={colors.primary} />
          </Pressable>
        ) : null}
        {props.onMoveDown ? (
          <Pressable onPress={props.onMoveDown} style={styles.iconAction}>
            <ArrowCircleDown20Regular color={colors.primary} />
          </Pressable>
        ) : null}
        <View style={styles.spacer} />
        {props.onEdit ? (
          <Pressable onPress={props.onEdit}>
            <Text style={[styles.action, { color: colors.primary }]}>{t("common:edit")}</Text>
          </Pressable>
        ) : null}
        {props.onDelete ? (
          <Pressable onPress={props.onDelete}>
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
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailEmoji: {
    fontSize: 20,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  unit: {
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconAction: {
    padding: 4,
  },
  spacer: {
    flex: 1,
  },
  action: {
    fontSize: 14,
    fontWeight: "600",
  },
});

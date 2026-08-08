import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Product } from "@/src/types/product";

type ProductListItemProps = {
  product: Product;
  onPress?: () => void;
  onToggleActive?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

export function ProductListItem({
  product,
  onPress,
  onToggleActive,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ProductListItemProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.text}>
        <Text style={[styles.name, { color: colors.text }, !product.isActive && { color: colors.mutedText }]}>
          {product.name}
        </Text>
        <Text style={[styles.unit, { color: colors.mutedText }]}>
          {product.defaultUnit} · Sortierung {product.sortOrder}
        </Text>
      </View>
      <View style={styles.actions}>
        {onMoveUp ? (
          <Pressable onPress={onMoveUp}>
            <Text style={[styles.edit, { color: colors.primary }]}>Hoch</Text>
          </Pressable>
        ) : null}
        {onMoveDown ? (
          <Pressable onPress={onMoveDown}>
            <Text style={[styles.edit, { color: colors.primary }]}>Runter</Text>
          </Pressable>
        ) : null}
        {onEdit ? (
          <Pressable onPress={onEdit}>
            <Text style={[styles.edit, { color: colors.primary }]}>Bearbeiten</Text>
          </Pressable>
        ) : null}
        {onDelete ? (
          <Pressable onPress={onDelete}>
            <Text style={[styles.edit, { color: colors.danger }]}>Loeschen</Text>
          </Pressable>
        ) : null}
        {onToggleActive ? (
          <Switch
            onValueChange={onToggleActive}
            trackColor={{ true: colors.primary }}
            value={product.isActive}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
  },
  text: {
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
  },
  unit: {
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  edit: {
    fontSize: 14,
    fontWeight: "600",
  },
});

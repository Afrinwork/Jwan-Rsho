import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Product } from "@/src/types/product";

type ProductListItemProps = {
  product: Product;
  onPress?: () => void;
  onToggleActive?: () => void;
  onEdit?: () => void;
};

export function ProductListItem({ product, onPress, onToggleActive, onEdit }: ProductListItemProps) {
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
        <Text style={[styles.unit, { color: colors.mutedText }]}>{product.defaultUnit}</Text>
      </View>
      <View style={styles.actions}>
        {onEdit ? (
          <Pressable onPress={onEdit}>
            <Text style={[styles.edit, { color: colors.primary }]}>Bearbeiten</Text>
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

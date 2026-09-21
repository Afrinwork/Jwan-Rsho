import { useState } from "react";
import { I18nManager, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Box20Regular } from "@fluentui/react-native-icons";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { QuantityStepper } from "@/src/components/ui/QuantityStepper";
import { SearchInput } from "@/src/components/ui/SearchInput";
import { useProducts } from "@/src/features/products/hooks/useProducts";
import { spacing } from "@/src/constants/spacing";
import { radius } from "@/src/theme/radius";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Product } from "@/src/types/product";
import { getLocalizedName } from "@/src/utils/localizedName";

export type ProductQuantitySelection = {
  product: Product;
  quantity: number;
};

type ProductQuantityListModalProps = {
  visible: boolean;
  initialQuantities: Record<string, number>;
  onCancel: () => void;
  onConfirm: (selections: ProductQuantitySelection[]) => void;
};

export function ProductQuantityListModal({
  visible,
  initialQuantities,
  onCancel,
  onConfirm,
}: ProductQuantityListModalProps) {
  const { products, loading, error } = useProducts();
  const [query, setQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [prevVisible, setPrevVisible] = useState(visible);
  const colors = useThemeColors();
  const { t, i18n } = useTranslation("orders");

  // Re-seeds the picker every time it opens, intentionally ignoring later
  // changes to initialQuantities while it stays open (same as the original
  // effect's deliberately narrow [visible] dependency) — adjusted directly
  // during render (React's documented pattern for "reset state when a prop
  // changes") rather than in an effect.
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setQuantities(initialQuantities);
      setQuery("");
    }
  }

  const normalized = query.trim().toLowerCase();
  const activeProducts = products
    .filter((product) => product.isActive)
    .filter(
      (product) =>
        product.name.toLowerCase().includes(normalized) || (product.nameAr ?? "").toLowerCase().includes(normalized),
    );

  const selectedCount = Object.values(quantities).filter((value) => value > 0).length;
  const totalQuantity = Object.values(quantities).reduce((sum, value) => sum + Math.max(value, 0), 0);

  function setQuantity(productId: string, quantity: number) {
    setQuantities((current) => ({ ...current, [productId]: quantity }));
  }

  function handleConfirm() {
    const selections = products
      .filter((product) => (quantities[product.id] ?? 0) > 0)
      .map((product) => ({ product, quantity: quantities[product.id] }));
    onConfirm(selections);
  }

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.panel, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <View style={styles.header}>
        <AppText style={styles.title} variant="subheading">
          {t("items.bulkTitle")}
        </AppText>
        <Pressable onPress={onCancel} hitSlop={8}>
          <AppText color="primary" variant="bodyMedium">
            {t("common:cancel")}
          </AppText>
        </Pressable>
      </View>

      <SearchInput onChangeText={setQuery} placeholder={t("items.searchPlaceholder")} value={query} />

      {loading ? <LoadingView label={t("products:loadingProducts")} /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && activeProducts.length === 0 ? (
        <EmptyState message={t("items.bulkEmptyMessage")} title={t("items.bulkEmptyTitle")} />
      ) : null}

      <View style={styles.list}>
        {activeProducts.map((item) => {
          const quantity = quantities[item.id] ?? 0;
          return (
            <View
              key={item.id}
              style={[
                styles.row,
                {
                  backgroundColor: quantity > 0 ? colors.primaryMuted : colors.surface,
                  borderColor: quantity > 0 ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.info}>
                <Box20Regular color={colors.mutedText} />
                <Text numberOfLines={3} style={[styles.name, { color: colors.text }]}>
                  {getLocalizedName(item, i18n.language)}
                </Text>
              </View>
              <View style={styles.controls}>
                <Text style={[styles.unit, { color: colors.mutedText }]}>{item.defaultUnit}</Text>
                <QuantityStepper onChange={(value) => setQuantity(item.id, value)} value={quantity} />
              </View>
            </View>
          );
        })}
      </View>

      <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppText variant="bodyMedium">{t("items.summaryTitle")}</AppText>
        <Text style={[styles.summaryLine, { color: colors.mutedText }]}>
          {t("items.summaryCount", { count: selectedCount })}
        </Text>
        <Text style={[styles.summaryLine, { color: colors.mutedText }]}>
          {t("items.summaryQuantity", { quantity: totalQuantity })}
        </Text>
      </View>

      <AppButton label={t("items.confirmSelection")} onPress={handleConfirm} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: radius.card,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
  },
  list: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  row: {
    alignItems: "stretch",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 104,
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minWidth: 0,
  },
  name: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.xs,
  },
  unit: {
    minWidth: 38,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  summary: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 4,
  },
  summaryLine: {
    fontSize: 13,
  },
});

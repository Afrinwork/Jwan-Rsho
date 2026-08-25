import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Box20Regular } from "@fluentui/react-native-icons";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { QuantityStepper } from "@/src/components/ui/QuantityStepper";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
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
  const colors = useThemeColors();
  const { t, i18n } = useTranslation("orders");

  useEffect(() => {
    if (visible) {
      setQuantities(initialQuantities);
      setQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

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

  return (
    <Modal animationType="slide" onRequestClose={onCancel} presentationStyle="pageSheet" visible={visible}>
      <ScreenContainer>
        <View style={styles.header}>
          <Pressable onPress={onCancel}>
            <AppText color="primary" variant="bodyMedium">
              {t("common:cancel")}
            </AppText>
          </Pressable>
          <AppText style={styles.title} variant="subheading">
            {t("items.bulkTitle")}
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        <SearchInput onChangeText={setQuery} placeholder={t("items.searchPlaceholder")} value={query} />

        {loading ? <LoadingView label={t("products:loadingProducts")} /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && activeProducts.length === 0 ? (
          <EmptyState message={t("items.bulkEmptyMessage")} title={t("items.bulkEmptyTitle")} />
        ) : null}

        <FlatList
          contentContainerStyle={styles.list}
          data={activeProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const quantity = quantities[item.id] ?? 0;
            return (
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: quantity > 0 ? colors.primaryMuted : colors.surface,
                    borderColor: quantity > 0 ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={styles.info}>
                  <View style={[styles.thumbnail, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                    {item.emoji ? <Text style={styles.emoji}>{item.emoji}</Text> : <Box20Regular color={colors.primary} />}
                  </View>
                  <Text numberOfLines={2} style={[styles.name, { color: colors.text }]}>
                    {getLocalizedName(item, i18n.language)}
                  </Text>
                </View>
                <View style={styles.controls}>
                  <Text style={[styles.unit, { color: colors.mutedText }]}>{item.defaultUnit}</Text>
                  <QuantityStepper onChange={(value) => setQuantity(item.id, value)} value={quantity} />
                </View>
              </View>
            );
          }}
        />

        <View style={[styles.summary, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <AppText variant="bodyMedium">{t("items.summaryTitle")}</AppText>
          <Text style={[styles.summaryLine, { color: colors.mutedText }]}>
            {t("items.summaryCount", { count: selectedCount })}
          </Text>
          <Text style={[styles.summaryLine, { color: colors.mutedText }]}>
            {t("items.summaryQuantity", { quantity: totalQuantity })}
          </Text>
        </View>

        <AppButton label={t("items.confirmSelection")} onPress={handleConfirm} />
      </ScreenContainer>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSpacer: {
    width: 48,
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
  list: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  thumbnail: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 18,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  unit: {
    fontSize: 13,
    fontWeight: "600",
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

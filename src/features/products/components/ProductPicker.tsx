import { useState } from "react";
import { FlatList, Modal, StyleSheet, Text } from "react-native";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SearchInput } from "@/src/components/ui/SearchInput";
import { useProducts } from "@/src/features/products/hooks/useProducts";
import { ProductListItem } from "@/src/features/products/components/ProductListItem";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Product } from "@/src/types/product";

type ProductPickerProps = {
  visible: boolean;
  excludeIds?: string[];
  onSelect: (product: Product) => void;
  onClose: () => void;
};

export function ProductPicker({ visible, excludeIds = [], onSelect, onClose }: ProductPickerProps) {
  const { products, loading, error } = useProducts();
  const [query, setQuery] = useState("");
  const colors = useThemeColors();

  const normalized = query.trim().toLowerCase();
  const available = products.filter(
    (product) =>
      product.isActive &&
      !excludeIds.includes(product.id) &&
      product.name.toLowerCase().includes(normalized),
  );

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
      <ScreenContainer>
        <Text style={[styles.title, { color: colors.text }]}>Produkt auswaehlen</Text>
        <SearchInput onChangeText={setQuery} placeholder="Produkt suchen" value={query} />
        {loading ? <LoadingView label="Produkte laden..." /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && available.length === 0 ? (
          <EmptyState message="Kein passendes Produkt gefunden." title="Keine Ergebnisse" />
        ) : null}
        <FlatList
          data={available}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductListItem
              onPress={() => {
                onSelect(item);
                setQuery("");
              }}
              product={item}
            />
          )}
          ItemSeparatorComponent={() => <Separator />}
        />
      </ScreenContainer>
    </Modal>
  );
}

function Separator() {
  return <Text style={styles.separator} />;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  separator: {
    height: 8,
  },
});

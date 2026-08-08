import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { spacing } from "@/src/constants/spacing";
import { ProductForm, ProductFormValues } from "@/src/features/products/components/ProductForm";
import { ProductListItem } from "@/src/features/products/components/ProductListItem";
import { useProducts } from "@/src/features/products/hooks/useProducts";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Product } from "@/src/types/product";

export function ProductManagementSection() {
  const { products, loading, error, addProduct, updateProduct, toggleActive, deleteProduct, moveProduct } = useProducts();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const colors = useThemeColors();

  async function handleAdd(values: ProductFormValues) {
    setActionError(null);
    await addProduct(values);
    setShowAddForm(false);
  }

  async function handleEdit(values: ProductFormValues) {
    if (!editingProduct) {
      return;
    }
    setActionError(null);
    await updateProduct(editingProduct.id, values);
    setEditingProduct(null);
  }

  function requestToggle(product: Product) {
    if (product.isActive) {
      setDeactivateTarget(product);
      return;
    }
    void toggleActive(product).catch((error) => setActionError(error instanceof Error ? error.message : "Produkt konnte nicht aktualisiert werden."));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Produkte</Text>
        {!showAddForm ? (
          <AppButton label="Produkt hinzufuegen" onPress={() => setShowAddForm(true)} variant="secondary" />
        ) : null}
      </View>

      {showAddForm ? (
        <ProductForm onCancel={() => setShowAddForm(false)} onSubmit={handleAdd} submitLabel="Produkt speichern" />
      ) : null}

      {loading ? <LoadingView label="Produkte laden..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {actionError ? <ErrorState message={actionError} /> : null}
      {!loading && !error && products.length === 0 ? (
        <EmptyState message="Noch keine Produkte angelegt." title="Keine Produkte" />
      ) : null}

      {products.map((product) =>
        editingProduct?.id === product.id ? (
          <ProductForm
            initialValues={{ name: product.name, defaultUnit: product.defaultUnit, sortOrder: product.sortOrder }}
            key={product.id}
            onCancel={() => setEditingProduct(null)}
            onSubmit={handleEdit}
            submitLabel="Aenderungen speichern"
          />
        ) : (
          <ProductListItem
            key={product.id}
            onDelete={() => setDeleteTarget(product)}
            onEdit={() => setEditingProduct(product)}
            onMoveDown={() => void moveProduct(product, "down").catch((error) => setActionError(error instanceof Error ? error.message : "Sortierung konnte nicht geaendert werden."))}
            onMoveUp={() => void moveProduct(product, "up").catch((error) => setActionError(error instanceof Error ? error.message : "Sortierung konnte nicht geaendert werden."))}
            onToggleActive={() => requestToggle(product)}
            product={product}
          />
        ),
      )}

      <ConfirmDialog
        confirmLabel="Deaktivieren"
        destructive
        message="Dieses Produkt wird nicht mehr in der Produktauswahl angezeigt."
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) {
            void toggleActive(deactivateTarget).catch((error) => setActionError(error instanceof Error ? error.message : "Produkt konnte nicht deaktiviert werden."));
          }
          setDeactivateTarget(null);
        }}
        title="Produkt deaktivieren?"
        visible={Boolean(deactivateTarget)}
      />
      <ConfirmDialog
        confirmLabel="Loeschen"
        destructive
        message="Dieses Produkt wird nur geloescht, wenn es noch in keiner Bestellung verwendet wurde."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void deleteProduct(deleteTarget).catch((error) => setActionError(error instanceof Error ? error.message : "Produkt konnte nicht geloescht werden."));
          }
          setDeleteTarget(null);
        }}
        title="Produkt wirklich loeschen?"
        visible={Boolean(deleteTarget)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
});

import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { spacing } from "@/src/constants/spacing";
import { ManagementSectionShell } from "@/src/features/management/components/ManagementSectionShell";
import { ProductForm, ProductFormValues } from "@/src/features/products/components/ProductForm";
import { ProductListItem } from "@/src/features/products/components/ProductListItem";
import { useProducts } from "@/src/features/products/hooks/useProducts";
import { Product } from "@/src/types/product";

export function ProductManagementSection() {
  const { products, loading, error, addProduct, updateProduct, toggleActive, deleteProduct, moveProduct } = useProducts();
  const [mode, setMode] = useState<"list" | "create">("list");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleAdd(values: ProductFormValues) {
    setActionError(null);
    setSuccessMessage(null);
    await addProduct(values);
    setSuccessMessage("Produkt wurde erfolgreich hinzugefuegt.");
    setMode("list");
  }

  async function handleEdit(values: ProductFormValues) {
    if (!editingProduct) {
      return;
    }

    setActionError(null);
    setSuccessMessage(null);
    await updateProduct(editingProduct.id, values);
    setSuccessMessage("Produkt wurde erfolgreich aktualisiert.");
    setEditingProduct(null);
  }

  function requestToggle(product: Product) {
    if (product.isActive) {
      setDeactivateTarget(product);
      return;
    }

    void toggleActive(product)
      .then(() => setSuccessMessage("Produkt wurde wieder aktiviert."))
      .catch((error) =>
        setActionError(error instanceof Error ? error.message : "Produkt konnte nicht aktualisiert werden."),
      );
  }

  return (
    <ManagementSectionShell
      createLabel="Produkt hinzufuegen"
      listLabel="Produktansicht"
      mode={mode}
      onModeChange={setMode}
      subtitle="Produkte anlegen, sortieren, bearbeiten, deaktivieren und sicher loeschen."
      title="Produkte"
    >
      {mode === "create" ? (
        <ProductForm onCancel={() => setMode("list")} onSubmit={handleAdd} submitLabel="Produkt speichern" />
      ) : null}
      {mode === "list" ? (
        <View style={styles.container}>
          {loading ? <LoadingView label="Produkte laden..." /> : null}
          {error ? <ErrorState message={error} /> : null}
          {actionError ? <ErrorState message={actionError} /> : null}
          {successMessage ? <SuccessState message={successMessage} /> : null}
          {!loading && !error && products.length === 0 ? (
            <EmptyState
              message="Lege hier mindestens ein Produkt an. Ohne Produkte kann keine Bestellung gespeichert werden."
              title="Keine Produkte"
            />
          ) : null}
          {products.map((product) =>
            editingProduct?.id === product.id ? (
              <ProductForm
                initialValues={{ name: product.name, defaultUnit: product.defaultUnit, emoji: product.emoji ?? "", sortOrder: product.sortOrder }}
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
                onMoveDown={() =>
                  void moveProduct(product, "down").catch((error) =>
                    setActionError(error instanceof Error ? error.message : "Sortierung konnte nicht geaendert werden."),
                  )
                }
                onMoveUp={() =>
                  void moveProduct(product, "up").catch((error) =>
                    setActionError(error instanceof Error ? error.message : "Sortierung konnte nicht geaendert werden."),
                  )
                }
                onToggleActive={() => requestToggle(product)}
                product={product}
              />
            ),
          )}
        </View>
      ) : null}
      <ConfirmDialog
        confirmLabel="Deaktivieren"
        destructive
        message="Dieses Produkt wird nicht mehr in der Produktauswahl angezeigt."
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) {
            void toggleActive(deactivateTarget)
              .then(() => setSuccessMessage("Produkt wurde deaktiviert."))
              .catch((error) =>
                setActionError(error instanceof Error ? error.message : "Produkt konnte nicht deaktiviert werden."),
              );
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
            void deleteProduct(deleteTarget)
              .then(() => setSuccessMessage("Produkt wurde geloescht."))
              .catch((error) =>
                setActionError(error instanceof Error ? error.message : "Produkt konnte nicht geloescht werden."),
              );
          }
          setDeleteTarget(null);
        }}
        title="Produkt wirklich loeschen?"
        visible={Boolean(deleteTarget)}
      />
    </ManagementSectionShell>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});

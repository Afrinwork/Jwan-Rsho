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
  const { t } = useTranslation("products");

  async function handleAdd(values: ProductFormValues) {
    setActionError(null);
    setSuccessMessage(null);
    await addProduct(values);
    setSuccessMessage(t("management.addSuccess"));
    setMode("list");
  }

  async function handleEdit(values: ProductFormValues) {
    if (!editingProduct) {
      return;
    }

    setActionError(null);
    setSuccessMessage(null);
    await updateProduct(editingProduct.id, values);
    setSuccessMessage(t("management.updateSuccess"));
    setEditingProduct(null);
  }

  function requestToggle(product: Product) {
    if (product.isActive) {
      setDeactivateTarget(product);
      return;
    }

    void toggleActive(product)
      .then(() => setSuccessMessage(t("management.activateSuccess")))
      .catch((error) =>
        setActionError(error instanceof Error ? error.message : t("management.updateError")),
      );
  }

  return (
    <ManagementSectionShell
      createLabel={t("management.createLabel")}
      listLabel={t("management.listLabel")}
      mode={mode}
      onModeChange={setMode}
      subtitle={t("management.subtitle")}
      title={t("management.title")}
    >
      {mode === "create" ? (
        <ProductForm onCancel={() => setMode("list")} onSubmit={handleAdd} submitLabel={t("management.addSubmitLabel")} />
      ) : null}
      {mode === "list" ? (
        <View style={styles.container}>
          {loading ? <LoadingView label={t("loadingProducts")} /> : null}
          {error ? <ErrorState message={error} /> : null}
          {actionError ? <ErrorState message={actionError} /> : null}
          {successMessage ? <SuccessState message={successMessage} /> : null}
          {!loading && !error && products.length === 0 ? (
            <EmptyState
              message={t("management.emptyMessage")}
              title={t("management.emptyTitle")}
            />
          ) : null}
          {products.map((product) =>
            editingProduct?.id === product.id ? (
              <ProductForm
                initialValues={{ name: product.name, defaultUnit: product.defaultUnit, emoji: product.emoji ?? "", sortOrder: product.sortOrder }}
                key={product.id}
                onCancel={() => setEditingProduct(null)}
                onSubmit={handleEdit}
                submitLabel={t("management.editSubmitLabel")}
              />
            ) : (
              <ProductListItem
                key={product.id}
                onDelete={() => setDeleteTarget(product)}
                onEdit={() => setEditingProduct(product)}
                onMoveDown={() =>
                  void moveProduct(product, "down").catch((error) =>
                    setActionError(error instanceof Error ? error.message : t("management.reorderError")),
                  )
                }
                onMoveUp={() =>
                  void moveProduct(product, "up").catch((error) =>
                    setActionError(error instanceof Error ? error.message : t("management.reorderError")),
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
        confirmLabel={t("management.deactivateButton")}
        destructive
        message={t("management.deactivateMessage")}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) {
            void toggleActive(deactivateTarget)
              .then(() => setSuccessMessage(t("management.deactivateSuccess")))
              .catch((error) =>
                setActionError(error instanceof Error ? error.message : t("management.deactivateError")),
              );
          }
          setDeactivateTarget(null);
        }}
        title={t("management.deactivateTitle")}
        visible={Boolean(deactivateTarget)}
      />
      <ConfirmDialog
        confirmLabel={t("common:delete")}
        destructive
        message={t("management.deleteMessage")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void deleteProduct(deleteTarget)
              .then(() => setSuccessMessage(t("management.deleteSuccess")))
              .catch((error) =>
                setActionError(error instanceof Error ? error.message : t("management.deleteError")),
              );
          }
          setDeleteTarget(null);
        }}
        title={t("management.deleteTitle")}
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

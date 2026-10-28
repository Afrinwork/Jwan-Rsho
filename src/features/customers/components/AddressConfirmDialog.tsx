import { useTranslation } from "react-i18next";

import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";

type AddressConfirmDialogProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Asked before saving a customer without a street and house number (see
// isPreciseAddress) — such a customer only lands roughly on the map.
export function AddressConfirmDialog({ visible, onConfirm, onCancel }: AddressConfirmDialogProps) {
  const { t } = useTranslation("customers");

  return (
    <ConfirmDialog
      cancelLabel={t("addressConfirm.cancel")}
      confirmLabel={t("addressConfirm.confirm")}
      message={t("addressConfirm.message")}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={t("addressConfirm.title")}
      visible={visible}
    />
  );
}

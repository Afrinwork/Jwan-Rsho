import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";

type SaveOrderButtonProps = {
  isSubmitting: boolean;
  onPress: () => void;
};

export function SaveOrderButton({ isSubmitting, onPress }: SaveOrderButtonProps) {
  const { t } = useTranslation("orders");

  return (
    <AppButton
      disabled={isSubmitting}
      label={isSubmitting ? t("save.saving") : t("save.button")}
      loading={isSubmitting}
      onPress={onPress}
    />
  );
}

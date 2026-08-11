import { useTranslation } from "react-i18next";

import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { DeleteUserForm } from "@/src/features/admin/components/DeleteUserForm";
import { AdminSectionHeader } from "@/src/features/admin/components/AdminSectionHeader";

export function DeleteUserScreenBody() {
  const { t } = useTranslation("admin");

  return (
    <ScreenContainer>
      <AdminSectionHeader subtitle={t("deleteUser.subtitle")} title={t("deleteUser.title")} />
      <DeleteUserForm />
    </ScreenContainer>
  );
}

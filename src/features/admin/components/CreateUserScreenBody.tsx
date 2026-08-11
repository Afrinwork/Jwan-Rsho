import { useTranslation } from "react-i18next";

import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { CreateUserForm } from "@/src/features/admin/components/CreateUserForm";
import { AdminSectionHeader } from "@/src/features/admin/components/AdminSectionHeader";

export function CreateUserScreenBody() {
  const { t } = useTranslation("admin");

  return (
    <ScreenContainer>
      <AdminSectionHeader subtitle={t("createUser.subtitle")} title={t("createUser.title")} />
      <CreateUserForm />
    </ScreenContainer>
  );
}

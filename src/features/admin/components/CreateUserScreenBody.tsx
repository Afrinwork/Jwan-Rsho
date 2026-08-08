import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { CreateUserForm } from "@/src/features/admin/components/CreateUserForm";
import { AdminSectionHeader } from "@/src/features/admin/components/AdminSectionHeader";

export function CreateUserScreenBody() {
  return (
    <ScreenContainer>
      <AdminSectionHeader subtitle="Nur der Admin darf neue Benutzerkonten anlegen." title="Benutzer anlegen" />
      <CreateUserForm />
    </ScreenContainer>
  );
}

import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { DeleteUserForm } from "@/src/features/admin/components/DeleteUserForm";
import { AdminSectionHeader } from "@/src/features/admin/components/AdminSectionHeader";

export function DeleteUserScreenBody() {
  return (
    <ScreenContainer>
      <AdminSectionHeader subtitle="Loeschen per E-Mail oder eindeutiger Benutzer-ID. Eigenes Konto bleibt geschuetzt." title="Benutzer loeschen" />
      <DeleteUserForm />
    </ScreenContainer>
  );
}

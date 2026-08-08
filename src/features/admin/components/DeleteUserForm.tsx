import { Controller } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { FormField } from "@/src/components/forms/FormField";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { useDeleteUser } from "@/src/features/admin/hooks/useDeleteUser";

export function DeleteUserForm() {
  const {
    form,
    submitError,
    successMessage,
    pendingEmail,
    requestDelete,
    confirmDelete,
    cancelDelete,
  } = useDeleteUser();

  return (
    <View style={styles.container}>
      <FormField error={form.formState.errors.email?.message} label="E-Mail des Benutzers">
        <Controller control={form.control} name="email" render={({ field }) => <AppInput autoCapitalize="none" keyboardType="email-address" onBlur={field.onBlur} onChangeText={field.onChange} placeholder="benutzer@beispiel.de" value={field.value} />} />
      </FormField>
      {submitError ? <ErrorState message={submitError} /> : null}
      {successMessage ? <SuccessState message={successMessage} /> : null}
      <AppButton disabled={form.formState.isSubmitting} label={form.formState.isSubmitting ? "Prueft..." : "Benutzer endgueltig loeschen"} onPress={requestDelete} variant="danger" />
      <ConfirmDialog
        cancelLabel="Abbrechen"
        confirmLabel="Endgueltig loeschen"
        destructive
        message={`Dieses Konto und alle dazugehoerigen Daten werden endgueltig geloescht. Diese Aktion kann nicht rueckgaengig gemacht werden.\n\n${pendingEmail ?? ""}`}
        onCancel={cancelDelete}
        onConfirm={() => void confirmDelete()}
        title="Benutzer wirklich loeschen?"
        visible={Boolean(pendingEmail)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});

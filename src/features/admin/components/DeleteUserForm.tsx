import { Controller } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("admin");

  return (
    <View style={styles.container}>
      <FormField error={form.formState.errors.email?.message} label={t("deleteUser.emailLabel")}>
        <Controller control={form.control} name="email" render={({ field }) => <AppInput autoCapitalize="none" keyboardType="email-address" onBlur={field.onBlur} onChangeText={field.onChange} placeholder={t("deleteUser.emailPlaceholder")} value={field.value} />} />
      </FormField>
      {submitError ? <ErrorState message={submitError} /> : null}
      {successMessage ? <SuccessState message={successMessage} /> : null}
      <AppButton disabled={form.formState.isSubmitting} label={form.formState.isSubmitting ? t("deleteUser.checking") : t("deleteUser.submitLabel")} onPress={requestDelete} variant="danger" />
      <ConfirmDialog
        cancelLabel={t("common:cancel")}
        confirmLabel={t("deleteUser.confirmLabel")}
        destructive
        message={`${t("deleteUser.confirmMessage")}\n\n${pendingEmail ?? ""}`}
        onCancel={cancelDelete}
        onConfirm={() => void confirmDelete()}
        title={t("deleteUser.confirmTitle")}
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

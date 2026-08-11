import { Controller } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { FormField } from "@/src/components/forms/FormField";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { useCreateUser } from "@/src/features/admin/hooks/useCreateUser";

export function CreateUserForm() {
  const { form, submit, submitError, successMessage } = useCreateUser();
  const { t } = useTranslation("admin");

  return (
    <View style={styles.container}>
      <FormField error={form.formState.errors.fullName?.message} label={t("createUser.fullNameLabel")}>
        <Controller control={form.control} name="fullName" render={({ field }) => <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder={t("createUser.fullNameLabel")} value={field.value} />} />
      </FormField>
      <FormField error={form.formState.errors.email?.message} label={t("createUser.emailLabel")}>
        <Controller control={form.control} name="email" render={({ field }) => <AppInput autoCapitalize="none" keyboardType="email-address" onBlur={field.onBlur} onChangeText={field.onChange} placeholder={t("createUser.emailLabel")} value={field.value} />} />
      </FormField>
      <FormField error={form.formState.errors.password?.message} label={t("createUser.passwordLabel")}>
        <Controller control={form.control} name="password" render={({ field }) => <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder={t("createUser.passwordLabel")} secureTextEntry value={field.value} />} />
      </FormField>
      <FormField error={form.formState.errors.confirmPassword?.message} label={t("createUser.confirmPasswordLabel")}>
        <Controller control={form.control} name="confirmPassword" render={({ field }) => <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder={t("createUser.confirmPasswordLabel")} secureTextEntry value={field.value} />} />
      </FormField>
      {submitError ? <ErrorState message={submitError} /> : null}
      {successMessage ? <SuccessState message={successMessage} /> : null}
      <AppButton disabled={form.formState.isSubmitting} label={form.formState.isSubmitting ? t("createUser.submitting") : t("createUser.submitLabel")} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});

import { Controller } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { FormField } from "@/src/components/forms/FormField";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { useCreateUser } from "@/src/features/admin/hooks/useCreateUser";

export function CreateUserForm() {
  const { form, submit, submitError, successMessage } = useCreateUser();

  return (
    <View style={styles.container}>
      <FormField error={form.formState.errors.fullName?.message} label="Vollstaendiger Name">
        <Controller control={form.control} name="fullName" render={({ field }) => <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="Vollstaendiger Name" value={field.value} />} />
      </FormField>
      <FormField error={form.formState.errors.email?.message} label="E-Mail">
        <Controller control={form.control} name="email" render={({ field }) => <AppInput autoCapitalize="none" keyboardType="email-address" onBlur={field.onBlur} onChangeText={field.onChange} placeholder="E-Mail" value={field.value} />} />
      </FormField>
      <FormField error={form.formState.errors.password?.message} label="Passwort">
        <Controller control={form.control} name="password" render={({ field }) => <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="Passwort" secureTextEntry value={field.value} />} />
      </FormField>
      <FormField error={form.formState.errors.confirmPassword?.message} label="Passwort wiederholen">
        <Controller control={form.control} name="confirmPassword" render={({ field }) => <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="Passwort wiederholen" secureTextEntry value={field.value} />} />
      </FormField>
      {submitError ? <ErrorState message={submitError} /> : null}
      {successMessage ? <SuccessState message={successMessage} /> : null}
      <AppButton disabled={form.formState.isSubmitting} label={form.formState.isSubmitting ? "Speichert..." : "Benutzer anlegen"} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});

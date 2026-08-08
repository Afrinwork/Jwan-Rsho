import { Controller } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { useDeleteUser } from "@/src/features/admin/hooks/useDeleteUser";

export function DeleteUserForm() {
  const { form, submit, submitError, successMessage } = useDeleteUser();

  return (
    <View style={styles.container}>
      <Controller control={form.control} name="identifier" render={({ field }) => <AppInput autoCapitalize="none" onBlur={field.onBlur} onChangeText={field.onChange} placeholder="E-Mail oder Benutzer-ID" value={field.value} />} />
      {submitError ? <ErrorState message={submitError} /> : null}
      {successMessage ? <SuccessState message={successMessage} /> : null}
      <AppButton disabled={form.formState.isSubmitting} label={form.formState.isSubmitting ? "Loescht..." : "Benutzer endgueltig loeschen"} onPress={submit} variant="danger" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});

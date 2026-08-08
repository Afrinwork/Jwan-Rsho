import { Controller } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { useForgotPassword } from "@/src/features/auth/hooks/useForgotPassword";

export function ForgotPasswordForm() {
  const { form, submit, error, message } = useForgotPassword();

  return (
    <View style={styles.container}>
      <Controller control={form.control} name="email" render={({ field }) => <AppInput autoCapitalize="none" keyboardType="email-address" onBlur={field.onBlur} onChangeText={field.onChange} placeholder="E-Mail" value={field.value} />} />
      {error ? <ErrorState message={error} /> : null}
      {message ? <SuccessState message={message} /> : null}
      <AppButton disabled={form.formState.isSubmitting} label={form.formState.isSubmitting ? "Sendet..." : "Reset senden"} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});

import { Controller } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { useLogin } from "@/src/features/auth/hooks/useLogin";
import { PasswordField } from "@/src/features/auth/components/PasswordField";

export function LoginForm() {
  const { t } = useTranslation("auth");
  const { form, submit, submitError } = useLogin();

  return (
    <View style={styles.container}>
      <Controller
        control={form.control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <AppInput
            autoCapitalize="none"
            keyboardType="email-address"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder={t("login.emailPlaceholder")}
            value={value}
          />
        )}
      />
      <PasswordField control={form.control} />
      {submitError ? <ErrorState message={submitError} /> : null}
      <AppButton
        disabled={form.formState.isSubmitting}
        label={form.formState.isSubmitting ? t("login.submitting") : t("login.submit")}
        onPress={submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});

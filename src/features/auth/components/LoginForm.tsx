import { Controller } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { routes } from "@/src/constants/routes";
import { colors } from "@/src/constants/colors";
import { useLogin } from "@/src/features/auth/hooks/useLogin";
import { PasswordField } from "@/src/features/auth/components/PasswordField";

export function LoginForm() {
  const { form, submit, submitError } = useLogin();
  const router = useRouter();

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
            placeholder="Email"
            value={value}
          />
        )}
      />
      <PasswordField control={form.control} />
      {submitError ? <ErrorState message={submitError} /> : null}
      <AppButton
        disabled={form.formState.isSubmitting}
        label={form.formState.isSubmitting ? "Signing in..." : "Login"}
        onPress={submit}
      />
      <Pressable onPress={() => router.push(routes.forgotPassword)}>
        <Text style={styles.link}>Forgot password?</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  link: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});

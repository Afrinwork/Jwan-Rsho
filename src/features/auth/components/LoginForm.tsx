import { useEffect, useRef } from "react";
import { Controller } from "react-hook-form";
import { Animated, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { useLogin } from "@/src/features/auth/hooks/useLogin";
import { PasswordField } from "@/src/features/auth/components/PasswordField";

export function LoginForm() {
  const { t } = useTranslation("auth");
  const { form, submit, submitError } = useLogin();
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!submitError) {
      return;
    }

    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shake, submitError]);

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX }] }]}>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});

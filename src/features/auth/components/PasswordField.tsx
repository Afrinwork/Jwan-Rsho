import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Controller, Control } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { AppInput } from "@/src/components/ui/AppInput";
import { colors } from "@/src/constants/colors";
import { LoginFormValues } from "@/src/features/auth/types/authTypes";

type PasswordFieldProps = {
  control: Control<LoginFormValues>;
};

export function PasswordField({ control }: PasswordFieldProps) {
  const { t } = useTranslation("auth");
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  return (
    <Controller
      control={control}
      name="password"
      render={({ field: { onBlur, onChange, value } }) => (
        <View style={styles.container}>
          <AppInput
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder={t("login.passwordPlaceholder")}
            secureTextEntry={secureTextEntry}
            value={value}
          />
          <Pressable onPress={() => setSecureTextEntry((current) => !current)}>
            <Text style={styles.toggle}>
              {secureTextEntry ? t("login.showPassword") : t("login.hidePassword")}
            </Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  toggle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});

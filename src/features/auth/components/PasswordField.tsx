import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Controller, Control } from "react-hook-form";

import { AppInput } from "@/src/components/ui/AppInput";
import { colors } from "@/src/constants/colors";
import { LoginFormValues } from "@/src/features/auth/types/authTypes";

type PasswordFieldProps = {
  control: Control<LoginFormValues>;
};

export function PasswordField({ control }: PasswordFieldProps) {
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  return (
    <Controller
      control={control}
      name="password"
      render={({ field: { onBlur, onChange, value } }) => (
        <View style={styles.container}>
          <AppInput
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Password"
            secureTextEntry={secureTextEntry}
            value={value}
          />
          <Pressable onPress={() => setSecureTextEntry((current) => !current)}>
            <Text style={styles.toggle}>{secureTextEntry ? "Show" : "Hide"}</Text>
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

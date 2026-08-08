import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { colors } from "@/src/constants/colors";
import { ForgotPasswordForm } from "@/src/features/auth/components/ForgotPasswordForm";

export function ForgotPasswordScreen() {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Passwort vergessen</Text>
        <Text style={styles.body}>
          Gib deine E-Mail ein, damit wir dir einen Reset-Link schicken.
        </Text>
      </View>
      <ForgotPasswordForm />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  body: {
    color: colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
  },
});

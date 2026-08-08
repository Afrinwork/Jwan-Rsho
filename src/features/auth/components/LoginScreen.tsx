import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { colors } from "@/src/constants/colors";
import { LoginForm } from "@/src/features/auth/components/LoginForm";
import { useAuthStore } from "@/src/store/authStore";

export function LoginScreen() {
  const authError = useAuthStore((state) => state.authError);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Sign in to manage your customers and orders.
        </Text>
      </View>
      {authError ? <ErrorState message={authError} /> : null}
      <LoginForm />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    paddingTop: 24,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
  },
});

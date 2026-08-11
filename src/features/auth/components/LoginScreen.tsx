import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/constants/spacing";
import { LoginForm } from "@/src/features/auth/components/LoginForm";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { useAuthStore } from "@/src/store/authStore";

export function LoginScreen() {
  const { t } = useTranslation("auth");
  const authError = useAuthStore((state) => state.authError);
  const colors = useThemeColors();

  return (
    <ScreenContainer>
      <View style={styles.shell}>
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: colors.primary }]}>{t("login.kicker")}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{t("login.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          {t("login.subtitle")}
          </Text>
        </View>
        <View style={[styles.panel, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, shadowColor: colors.shadow }]}>
          {authError ? <ErrorState message={authError} /> : null}
          <LoginForm />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.lg,
  },
  header: {
    gap: 8,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
});

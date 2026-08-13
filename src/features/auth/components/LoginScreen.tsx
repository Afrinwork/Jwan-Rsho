import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/theme/spacing";
import { LoginForm } from "@/src/features/auth/components/LoginForm";
import { useAuthStore } from "@/src/store/authStore";

export function LoginScreen() {
  const { t } = useTranslation("auth");
  const authError = useAuthStore((state) => state.authError);

  return (
    <ScreenContainer>
      <View style={styles.shell}>
        <View style={styles.header}>
          <AppText color="primary" style={styles.kicker} variant="label">
            {t("login.kicker")}
          </AppText>
          <AppText style={styles.title} variant="display">
            {t("login.title")}
          </AppText>
          <AppText color="muted" style={styles.subtitle} variant="body">
            {t("login.subtitle")}
          </AppText>
        </View>
        <AppCard contentStyle={styles.panel} frosted>
          {authError ? <ErrorState message={authError} /> : null}
          <LoginForm />
        </AppCard>
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
    paddingHorizontal: 4,
  },
  kicker: {
    letterSpacing: 1.6,
  },
  title: {},
  subtitle: {},
  panel: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});

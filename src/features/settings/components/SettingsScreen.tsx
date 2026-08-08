import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { colors } from "@/src/constants/colors";
import { appConfig } from "@/src/constants/app";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useLogout } from "@/src/features/settings/hooks/useLogout";

export function SettingsScreen() {
  const user = useCurrentUser();
  const { logout, loading, error } = useLogout();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Einstellungen</Text>
        <Text style={styles.subtitle}>{user?.email ?? "Nicht angemeldet"}</Text>
        <Text style={styles.subtitle}>Version {appConfig.version}</Text>
      </View>
      {error ? <ErrorState message={error} /> : null}
      <AppButton label={loading ? "Logout..." : "Logout"} onPress={logout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
  },
});

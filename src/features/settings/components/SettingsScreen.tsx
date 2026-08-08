import { ScrollView, StyleSheet, Text, View } from "react-native";

import { FormField } from "@/src/components/forms/FormField";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { appConfig } from "@/src/constants/app";
import { spacing } from "@/src/constants/spacing";
import { useLogout } from "@/src/features/settings/hooks/useLogout";
import { useSettings } from "@/src/features/settings/hooks/useSettings";
import { SettingsChoiceRow } from "@/src/features/settings/components/SettingsChoiceRow";
import { SettingsSection } from "@/src/features/settings/components/SettingsSection";
import { SettingsToggleRow } from "@/src/features/settings/components/SettingsToggleRow";
import { useThemeColors } from "@/src/hooks/useThemeColors";

export function SettingsScreen() {
  const colors = useThemeColors();
  const { logout, loading, error } = useLogout();
  const settings = useSettings();

  if (settings.loading) {
    return <LoadingView label="Einstellungen werden geladen..." />;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Einstellungen</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>Persoenliche Angaben, Darstellung und Teilen</Text>
        </View>
        {settings.error ? <ErrorState message={settings.error} /> : null}
        {error ? <ErrorState message={error} /> : null}
        {settings.successMessage ? <SuccessState message={settings.successMessage} /> : null}
        <SettingsSection title="Profil">
          <FormField label="Name">
            <AppInput onChangeText={settings.setFullName} value={settings.fullName} />
          </FormField>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedText }]}>E-Mail</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{settings.user?.email ?? "Nicht vorhanden"}</Text>
          </View>
          <AppButton
            label={settings.resettingPassword ? "Reset wird gesendet..." : "Passwort-Reset senden"}
            loading={settings.resettingPassword}
            onPress={() => void settings.resetPassword()}
            variant="secondary"
          />
        </SettingsSection>
        <SettingsSection title="Darstellung">
          <SettingsChoiceRow
            label="Theme"
            onChange={(value) => settings.setThemeMode(value as "system" | "light" | "dark")}
            options={[
              { label: "System", value: "system" },
              { label: "Hell", value: "light" },
              { label: "Dunkel", value: "dark" },
            ]}
            value={settings.themeMode}
          />
        </SettingsSection>
        <SettingsSection title="Navigation">
          <SettingsChoiceRow
            label="Bevorzugte App"
            onChange={(value) => settings.setPreferredNavigationApp(value as "apple-maps" | "google-maps" | "waze")}
            options={[
              { label: "Apple Maps", value: "apple-maps" },
              { label: "Google Maps", value: "google-maps" },
              { label: "Waze", value: "waze" },
            ]}
            value={settings.preferredNavigationApp}
          />
        </SettingsSection>
        <SettingsSection title="Teilen">
          <SettingsToggleRow
            label="Adresse im Share-Text"
            onChange={(value) => settings.setShareOptions({
              shareIncludeAddress: value,
              shareIncludePhone: settings.shareIncludePhone,
              shareIncludeTotals: settings.shareIncludeTotals,
            })}
            value={settings.shareIncludeAddress}
          />
          <SettingsToggleRow
            label="Telefonnummer im Share-Text"
            onChange={(value) => settings.setShareOptions({
              shareIncludeAddress: settings.shareIncludeAddress,
              shareIncludePhone: value,
              shareIncludeTotals: settings.shareIncludeTotals,
            })}
            value={settings.shareIncludePhone}
          />
          <SettingsToggleRow
            label="Gesamtsummen im Share-Text"
            onChange={(value) => settings.setShareOptions({
              shareIncludeAddress: settings.shareIncludeAddress,
              shareIncludePhone: settings.shareIncludePhone,
              shareIncludeTotals: value,
            })}
            value={settings.shareIncludeTotals}
          />
        </SettingsSection>
        <SettingsSection title="App-Informationen">
          <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: colors.mutedText }]}>App-Version</Text><Text style={[styles.infoValue, { color: colors.text }]}>{appConfig.version}</Text></View>
          <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: colors.mutedText }]}>Eigene Kunden</Text><Text style={[styles.infoValue, { color: colors.text }]}>{settings.stats.customers}</Text></View>
          <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: colors.mutedText }]}>Gesamtbestellungen</Text><Text style={[styles.infoValue, { color: colors.text }]}>{settings.stats.totalOrders}</Text></View>
          <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: colors.mutedText }]}>Offene Bestellungen</Text><Text style={[styles.infoValue, { color: colors.text }]}>{settings.stats.openOrders}</Text></View>
        </SettingsSection>
        <SettingsSection title="Konto">
          <AppButton label={settings.saving ? "Speichert..." : "Einstellungen speichern"} loading={settings.saving} onPress={() => void settings.save()} />
          <AppButton label={loading ? "Logout..." : "Logout"} loading={loading} onPress={logout} variant="secondary" />
        </SettingsSection>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
  },
});

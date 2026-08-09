import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
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
        <AnimatedEntrance>
          <CompactScreenHeader subtitle="Profil, Teilen und Navigation." title="Einstellungen" />
        </AnimatedEntrance>
        {settings.error ? <AnimatedEntrance delay={60}><ErrorState message={settings.error} /></AnimatedEntrance> : null}
        {error ? <AnimatedEntrance delay={80}><ErrorState message={error} /></AnimatedEntrance> : null}
        {settings.successMessage ? <AnimatedEntrance delay={100}><SuccessState message={settings.successMessage} /></AnimatedEntrance> : null}
        <AnimatedEntrance delay={120}><SettingsSection title="Profil">
          <FormField label="Name">
            <AppInput onChangeText={settings.setFullName} value={settings.fullName} />
          </FormField>
          <FormField label="E-Mail">
            <AppInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={settings.setEmail}
              value={settings.email}
            />
          </FormField>
          <FormField label="Neues Passwort">
            <AppInput onChangeText={settings.setNewPassword} secureTextEntry value={settings.newPassword} />
          </FormField>
        </SettingsSection></AnimatedEntrance>
        <AnimatedEntrance delay={150}><SettingsSection title="Darstellung">
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
        </SettingsSection></AnimatedEntrance>
        <AnimatedEntrance delay={180}><SettingsSection title="Navigation">
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
        </SettingsSection></AnimatedEntrance>
        <AnimatedEntrance delay={210}><SettingsSection title="Teilen">
          <FormField label="Geschaeftsname (im Sammeltext)">
            <AppInput
              onChangeText={settings.setShopName}
              placeholder="z. B. 🧀 Rsho Kaeserei"
              value={settings.shopName}
            />
          </FormField>
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
        </SettingsSection></AnimatedEntrance>
        <AnimatedEntrance delay={240}><SettingsSection title="App-Informationen">
          <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: colors.mutedText }]}>App-Version</Text><Text style={[styles.infoValue, { color: colors.text }]}>{appConfig.version}</Text></View>
          <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: colors.mutedText }]}>Eigene Kunden</Text><Text style={[styles.infoValue, { color: colors.text }]}>{settings.stats.customers}</Text></View>
          <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: colors.mutedText }]}>Gesamtbestellungen</Text><Text style={[styles.infoValue, { color: colors.text }]}>{settings.stats.totalOrders}</Text></View>
          <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: colors.mutedText }]}>Offene Bestellungen</Text><Text style={[styles.infoValue, { color: colors.text }]}>{settings.stats.openOrders}</Text></View>
        </SettingsSection></AnimatedEntrance>
        <AnimatedEntrance delay={270}><SettingsSection title="Konto">
          <AppButton label={settings.saving ? "Speichert..." : "Einstellungen speichern"} loading={settings.saving} onPress={() => void settings.save()} />
          <AppButton label={loading ? "Logout..." : "Logout"} loading={loading} onPress={logout} variant="secondary" />
        </SettingsSection></AnimatedEntrance>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
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

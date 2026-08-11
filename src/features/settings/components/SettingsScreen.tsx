import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("settings");
  const colors = useThemeColors();
  const { logout, loading, error } = useLogout();
  const settings = useSettings();

  if (settings.loading) {
    return <LoadingView label={t("loadingLabel")} />;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedEntrance>
          <CompactScreenHeader subtitle={t("header.subtitle")} title={t("header.title")} />
        </AnimatedEntrance>
        {settings.error ? <AnimatedEntrance delay={60}><ErrorState message={settings.error} /></AnimatedEntrance> : null}
        {error ? <AnimatedEntrance delay={80}><ErrorState message={error} /></AnimatedEntrance> : null}
        {settings.successMessage ? <AnimatedEntrance delay={100}><SuccessState message={settings.successMessage} /></AnimatedEntrance> : null}
        <AnimatedEntrance delay={120}><SettingsSection title={t("sections.profile")}>
          <FormField label={t("fields.name")}>
            <AppInput onChangeText={settings.setFullName} value={settings.fullName} />
          </FormField>
          <FormField label={t("fields.email")}>
            <AppInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={settings.setEmail}
              value={settings.email}
            />
          </FormField>
          <FormField label={t("fields.newPassword")}>
            <AppInput onChangeText={settings.setNewPassword} secureTextEntry value={settings.newPassword} />
          </FormField>
        </SettingsSection></AnimatedEntrance>
        <AnimatedEntrance delay={150}><SettingsSection title={t("sections.appearance")}>
          <SettingsChoiceRow
            label={t("theme.label")}
            onChange={(value) => settings.setThemeMode(value as "system" | "light" | "dark")}
            options={[
              { label: t("theme.system"), value: "system" },
              { label: t("theme.light"), value: "light" },
              { label: t("theme.dark"), value: "dark" },
            ]}
            value={settings.themeMode}
          />
          <SettingsChoiceRow
            label={t("language_picker.label")}
            onChange={(value) => settings.setLanguage(value as "de" | "ar")}
            options={[
              { label: t("language_picker.de"), value: "de" },
              { label: t("language_picker.ar"), value: "ar" },
            ]}
            value={settings.language}
          />
        </SettingsSection></AnimatedEntrance>
        <AnimatedEntrance delay={180}><SettingsSection title={t("sections.navigation")}>
          <SettingsChoiceRow
            label={t("navigationApp.label")}
            onChange={(value) => settings.setPreferredNavigationApp(value as "apple-maps" | "google-maps" | "waze")}
            options={[
              { label: t("navigationApp.appleMaps"), value: "apple-maps" },
              { label: t("navigationApp.googleMaps"), value: "google-maps" },
              { label: t("navigationApp.waze"), value: "waze" },
            ]}
            value={settings.preferredNavigationApp}
          />
        </SettingsSection></AnimatedEntrance>
        <AnimatedEntrance delay={210}><SettingsSection title={t("sections.share")}>
          <FormField label={t("share.shopName")}>
            <AppInput
              onChangeText={settings.setShopName}
              placeholder={t("share.shopNamePlaceholder")}
              value={settings.shopName}
            />
          </FormField>
          <SettingsToggleRow
            label={t("share.includeAddress")}
            onChange={(value) => settings.setShareOptions({
              shareIncludeAddress: value,
              shareIncludePhone: settings.shareIncludePhone,
              shareIncludeTotals: settings.shareIncludeTotals,
            })}
            value={settings.shareIncludeAddress}
          />
          <SettingsToggleRow
            label={t("share.includePhone")}
            onChange={(value) => settings.setShareOptions({
              shareIncludeAddress: settings.shareIncludeAddress,
              shareIncludePhone: value,
              shareIncludeTotals: settings.shareIncludeTotals,
            })}
            value={settings.shareIncludePhone}
          />
          <SettingsToggleRow
            label={t("share.includeTotals")}
            onChange={(value) => settings.setShareOptions({
              shareIncludeAddress: settings.shareIncludeAddress,
              shareIncludePhone: settings.shareIncludePhone,
              shareIncludeTotals: value,
            })}
            value={settings.shareIncludeTotals}
          />
        </SettingsSection></AnimatedEntrance>
        <AnimatedEntrance delay={240}><SettingsSection title={t("sections.appInfo")}>
          <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: colors.mutedText }]}>{t("info.appVersion")}</Text><Text style={[styles.infoValue, { color: colors.text }]}>{appConfig.version}</Text></View>
          <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: colors.mutedText }]}>{t("info.ownCustomers")}</Text><Text style={[styles.infoValue, { color: colors.text }]}>{settings.stats.customers}</Text></View>
          <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: colors.mutedText }]}>{t("info.totalOrders")}</Text><Text style={[styles.infoValue, { color: colors.text }]}>{settings.stats.totalOrders}</Text></View>
          <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: colors.mutedText }]}>{t("info.openOrders")}</Text><Text style={[styles.infoValue, { color: colors.text }]}>{settings.stats.openOrders}</Text></View>
        </SettingsSection></AnimatedEntrance>
        <AnimatedEntrance delay={270}><SettingsSection title={t("sections.account")}>
          <AppButton label={settings.saving ? t("actions.saving") : t("actions.save")} loading={settings.saving} onPress={() => void settings.save()} />
          <AppButton label={loading ? t("actions.loggingOut") : t("common:logout")} loading={loading} onPress={logout} variant="secondary" />
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

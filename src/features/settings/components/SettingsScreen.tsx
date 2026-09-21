import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
import { FormField } from "@/src/components/forms/FormField";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { AppText } from "@/src/components/ui/AppText";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { appConfig } from "@/src/constants/app";
import { spacing } from "@/src/constants/spacing";
import { isSuperAdmin } from "@/src/features/auth/permissions";
import { useDeleteAccount } from "@/src/features/settings/hooks/useDeleteAccount";
import { useLogout } from "@/src/features/settings/hooks/useLogout";
import { useSettings } from "@/src/features/settings/hooks/useSettings";
import { SettingsChoiceRow } from "@/src/features/settings/components/SettingsChoiceRow";
import { SettingsSection } from "@/src/features/settings/components/SettingsSection";
import { SettingsToggleRow } from "@/src/features/settings/components/SettingsToggleRow";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";

export function SettingsScreen() {
  const { t } = useTranslation("settings");
  const { logout, loading, error } = useLogout();
  const deleteAccount = useDeleteAccount();
  const settings = useSettings();
  const currentUser = useCurrentUser();
  const canEditShareSettings = isSuperAdmin(currentUser);

  if (settings.loading) {
    return <LoadingView label={t("loadingLabel")} />;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <CompactScreenHeader subtitle={t("header.subtitle")} title={t("header.title")} />
        {settings.error ? <ErrorState message={settings.error} /> : null}
        {error ? <ErrorState message={error} /> : null}
        {settings.successMessage ? <SuccessState message={settings.successMessage} /> : null}
        <AnimatedEntrance delay={120}><SettingsSection subtitle={t("fields.email")} title={t("sections.profile")}>
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
        <AnimatedEntrance delay={150}><SettingsSection subtitle={t("theme.label")} title={t("sections.appearance")}>
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
        </SettingsSection></AnimatedEntrance>
        <AnimatedEntrance delay={165}><SettingsSection subtitle={t("language.restartHint")} title={t("sections.language")}>
          <SettingsChoiceRow
            label={t("language.label")}
            onChange={(value) => settings.setLanguage(value as "ar" | "de")}
            options={[
              { label: t("language.arabic"), value: "ar" },
              { label: t("language.german"), value: "de" },
            ]}
            value={settings.language}
          />
        </SettingsSection></AnimatedEntrance>
        <AnimatedEntrance delay={180}><SettingsSection subtitle={t("navigationApp.label")} title={t("sections.navigation")}>
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
        {canEditShareSettings ? (
          <AnimatedEntrance delay={210}><SettingsSection subtitle={t("share.shopName")} title={t("sections.share")}>
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
        ) : null}
        <AnimatedEntrance delay={240}><SettingsSection subtitle={t("header.subtitle")} title={t("sections.appInfo")}>
          <View style={styles.infoRow}><AppText color="muted" style={styles.infoLabel} variant="body">{t("info.appVersion")}</AppText><AppText style={styles.infoValue} variant="bodyMedium">{appConfig.version}</AppText></View>
          <View style={styles.infoRow}><AppText color="muted" style={styles.infoLabel} variant="body">{t("info.ownCustomers")}</AppText><AppText style={styles.infoValue} variant="bodyMedium">{settings.stats.customers}</AppText></View>
          <View style={styles.infoRow}><AppText color="muted" style={styles.infoLabel} variant="body">{t("info.totalOrders")}</AppText><AppText style={styles.infoValue} variant="bodyMedium">{settings.stats.totalOrders}</AppText></View>
          <View style={styles.infoRow}><AppText color="muted" style={styles.infoLabel} variant="body">{t("info.openOrders")}</AppText><AppText style={styles.infoValue} variant="bodyMedium">{settings.stats.openOrders}</AppText></View>
        </SettingsSection></AnimatedEntrance>
        <AnimatedEntrance delay={270}><SettingsSection subtitle={t("actions.save")} title={t("sections.account")}>
          <AppButton label={settings.saving ? t("actions.saving") : t("actions.save")} loading={settings.saving} onPress={() => void settings.save()} />
          <AppButton label={loading ? t("actions.loggingOut") : t("common:logout")} loading={loading} onPress={logout} variant="secondary" />
          {deleteAccount.error ? <ErrorState message={deleteAccount.error} /> : null}
          <AppButton
            label={deleteAccount.loading ? t("actions.deletingAccount") : t("actions.deleteAccount")}
            loading={deleteAccount.loading}
            onPress={deleteAccount.requestDelete}
            variant="danger"
          />
        </SettingsSection></AnimatedEntrance>
      </ScrollView>
      <ConfirmDialog
        cancelLabel={t("common:cancel")}
        confirmLabel={t("actions.deleteAccountConfirm")}
        destructive
        message={t("actions.deleteAccountMessage")}
        onCancel={deleteAccount.cancelDelete}
        onConfirm={() => void deleteAccount.confirmDelete()}
        title={t("actions.deleteAccountTitle")}
        visible={deleteAccount.confirming}
      />
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
    paddingVertical: 6,
  },
  infoLabel: {},
  infoValue: {
    textAlign: "right",
    flexShrink: 1,
  },
});

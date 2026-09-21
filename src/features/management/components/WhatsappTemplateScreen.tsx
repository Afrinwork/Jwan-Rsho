import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { AppText } from "@/src/components/ui/AppText";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { canManageDrivers } from "@/src/features/auth/permissions";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { userPreferencesRepository } from "@/src/repositories/userPreferencesRepository";
import { useAppStore } from "@/src/store/appStore";
import { formatError } from "@/src/utils/formatError";
import { spacing } from "@/src/theme/spacing";

export function WhatsappTemplateScreen() {
  const { t } = useTranslation("management");
  const user = useCurrentUser();
  const {
    language,
    preferredNavigationApp,
    shareIncludeAddress,
    shareIncludePhone,
    shareIncludeTotals,
    shopName,
    themeMode,
    whatsappSelectionTemplate,
    setWhatsappSelectionTemplate,
  } = useAppStore();
  const savedTemplate = whatsappSelectionTemplate ?? "";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const userId = user?.uid;

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!userId) {
        return () => {
          active = false;
        };
      }

      void userPreferencesRepository.getPreferences().then((preferences) => {
        if (active && preferences?.whatsappSelectionTemplate !== undefined) {
          setWhatsappSelectionTemplate(preferences.whatsappSelectionTemplate);
        }
      }).catch(() => {
        // The already-loaded text stays usable when a background refresh fails.
      });

      return () => {
        active = false;
      };
    }, [setWhatsappSelectionTemplate, userId]),
  );

  if (!canManageDrivers(user) || !userId) {
    return <ScreenContainer><ErrorState message={t("whatsappTemplate.notAllowed")} /></ScreenContainer>;
  }
  const ownerId = userId;

  async function save(draft: string) {
    const template = draft.trim();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await userPreferencesRepository.savePreferences({
        ownerId,
        language,
        preferredNavigationApp,
        shareIncludeAddress,
        shareIncludePhone,
        shareIncludeTotals,
        shopName,
        themeMode,
        whatsappSelectionTemplate: template,
      });
      setWhatsappSelectionTemplate(template);
      setSaved(true);
    } catch (saveError) {
      setError(formatError(saveError).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <CompactScreenHeader subtitle={t("whatsappTemplate.subtitle")} title={t("whatsappTemplate.title")} />
        <WhatsappTemplateForm
          error={error}
          initialTemplate={savedTemplate}
          key={savedTemplate}
          onSave={save}
          saved={saved}
          saving={saving}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

function WhatsappTemplateForm({
  error,
  initialTemplate,
  onSave,
  saved,
  saving,
}: {
  error: string | null;
  initialTemplate: string;
  onSave: (draft: string) => Promise<void>;
  saved: boolean;
  saving: boolean;
}) {
  const { t } = useTranslation("management");
  const [draft, setDraft] = useState(initialTemplate);

  return (
    <View style={styles.form}>
      <AppText variant="label">{t("whatsappTemplate.fieldLabel")}</AppText>
      <AppInput
        multiline
        onChangeText={setDraft}
        placeholder={t("whatsappTemplate.placeholder")}
        style={styles.input}
        textAlignVertical="top"
        value={draft}
      />
      <AppText color="muted" variant="caption">{t("whatsappTemplate.placeholders")}</AppText>
      {error ? <ErrorState message={error} /> : null}
      {saved ? <SuccessState message={t("whatsappTemplate.saved")} /> : null}
      <AppButton disabled={saving} label={t("whatsappTemplate.save")} loading={saving} onPress={() => void onSave(draft)} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  form: { gap: spacing.sm },
  input: { minHeight: 180, paddingTop: spacing.sm },
});

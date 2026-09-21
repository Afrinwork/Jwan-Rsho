import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { spacing } from "@/src/constants/spacing";
import { ManagementSectionShell } from "@/src/features/management/components/ManagementSectionShell";
import { useSeedCatalog } from "@/src/features/management/hooks/useSeedCatalog";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";

export function CatalogManagementScreen() {
  const colors = useThemeColors();
  const { seed, reset, loading, result, error } = useSeedCatalog();
  const [mode, setMode] = useState<"list" | "create">("list");
  const [resetConfirmVisible, setResetConfirmVisible] = useState(false);
  const { t } = useTranslation("management");

  return (
    <ScreenContainer>
      <ManagementSectionShell
        createLabel={t("catalogScreen.createModeLabel")}
        listLabel={t("catalogScreen.listModeLabel")}
        mode={mode}
        onModeChange={setMode}
        subtitle={t("catalogScreen.subtitle")}
        title={t("catalogScreen.title")}
      >
        {error ? <ErrorState message={error} /> : null}
        {result ? <SuccessState message={result} /> : null}
        {mode === "list" ? (
          <View style={styles.actions}>
            <AppButton label={t("catalogScreen.loadButton")} loading={loading} onPress={() => void seed()} />
            <AppButton
              label={t("seed.resetButton")}
              loading={loading}
              onPress={() => setResetConfirmVisible(true)}
              variant="danger"
            />
          </View>
        ) : (
          <View style={[styles.infoCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <AppText variant="bodyMedium">{t("catalogScreen.infoTitle")}</AppText>
            <AppText color="muted" variant="body">{t("catalogScreen.infoBody")}</AppText>
          </View>
        )}
      </ManagementSectionShell>
      <ConfirmDialog
        destructive
        message={t("seed.resetConfirmMessage")}
        onCancel={() => setResetConfirmVisible(false)}
        onConfirm={() => {
          setResetConfirmVisible(false);
          void reset();
        }}
        title={t("seed.resetConfirmTitle")}
        visible={resetConfirmVisible}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  infoCard: { borderWidth: 1, borderRadius: radius.card, padding: spacing.md, gap: spacing.xs },
});

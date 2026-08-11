import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/constants/spacing";
import { useSeedCatalog } from "@/src/features/management/hooks/useSeedCatalog";
import { useThemeColors } from "@/src/hooks/useThemeColors";

export function SeedCatalogSection() {
  const { seed, loading, result, error } = useSeedCatalog();
  const colors = useThemeColors();
  const { t } = useTranslation("management");

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t("seedSection.title")}</Text>
      <Text style={[styles.body, { color: colors.mutedText }]}>{t("seedSection.body")}</Text>
      {error ? <ErrorState message={error} /> : null}
      {result ? <Text style={[styles.result, { color: colors.primary }]}>{result}</Text> : null}
      <AppButton label={t("seedSection.loadButton")} loading={loading} onPress={() => void seed()} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: spacing.md, gap: spacing.sm },
  title: { fontSize: 18, fontWeight: "700" },
  body: { fontSize: 14, lineHeight: 20 },
  result: { fontSize: 14, fontWeight: "600" },
});

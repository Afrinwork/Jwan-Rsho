import { StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { colors } from "@/src/constants/colors";
import { spacing } from "@/src/constants/spacing";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
};

export function FeaturePlaceholder({
  title,
  description,
}: FeaturePlaceholderProps) {
  const { t } = useTranslation("common");

  return (
    <ScreenContainer>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <EmptyState message={description} title={t("notAvailableYet")} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
});

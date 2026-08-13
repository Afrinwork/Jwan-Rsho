import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/src/components/ui/AppText";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { spacing } from "@/src/theme/spacing";

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
      <AppText accessibilityRole="header" style={styles.title} variant="title">
        {title}
      </AppText>
      <EmptyState message={description} title={t("notAvailableYet")} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.sm,
  },
});

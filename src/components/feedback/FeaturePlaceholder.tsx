import { StyleSheet, Text } from "react-native";

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
  return (
    <ScreenContainer>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <EmptyState message={description} title="Noch nicht verfuegbar" />
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

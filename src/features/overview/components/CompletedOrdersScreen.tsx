import { ScrollView, StyleSheet } from "react-native";

import { CompletedTodaySection } from "@/src/features/overview/components/CompletedTodaySection";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { spacing } from "@/src/theme/spacing";

export function CompletedOrdersScreen() {
  const colors = useThemeColors();

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <CompletedTodaySection scope="all" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
});

import { PropsWithChildren } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

export function ScreenContainer({ children }: PropsWithChildren) {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.backdrop, { backgroundColor: colors.backgroundAccent }]} />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: -96,
    left: -28,
    right: -28,
    height: 248,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    opacity: 0.52,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
});

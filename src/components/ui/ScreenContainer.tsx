import { PropsWithChildren } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";

import { colors } from "@/src/constants/colors";
import { spacing } from "@/src/constants/spacing";

export function ScreenContainer({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
});

import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeColors } from "@/src/hooks/useThemeColors";
import { spacing } from "@/src/theme/spacing";

type ScreenContainerProps = PropsWithChildren<{
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function ScreenContainer({ children, contentStyle }: ScreenContainerProps) {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
});

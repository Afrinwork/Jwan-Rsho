import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type ScreenContainerProps = PropsWithChildren<{
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function ScreenContainer({ children, contentStyle }: ScreenContainerProps) {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.backgroundAccent, colors.background]}
        end={{ x: 0.85, y: 0.95 }}
        start={{ x: 0.15, y: 0 }}
        style={styles.backdrop}
      />
      <View style={[styles.backdropGlow, { backgroundColor: colors.primaryMuted }]} />
      <View style={[styles.backdropGlowSecondary, { backgroundColor: colors.secondaryMuted }]} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  backdropGlow: {
    position: "absolute",
    top: 24,
    right: -26,
    width: 170,
    height: 170,
    borderRadius: radius.pill,
    opacity: 0.7,
  },
  backdropGlowSecondary: {
    position: "absolute",
    top: 112,
    left: -42,
    width: 132,
    height: 132,
    borderRadius: radius.pill,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
});

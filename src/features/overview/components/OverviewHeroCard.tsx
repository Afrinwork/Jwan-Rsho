import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { shadows } from "@/src/theme/shadows";
import { spacing } from "@/src/theme/spacing";

type OverviewHeroCardProps = {
  title: string;
  subtitle: string;
  value: string;
};

export function OverviewHeroCard(props: OverviewHeroCardProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: colors.primaryStrong,
          shadowColor: colors.primary,
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primaryStrong, colors.primary, colors.secondary]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.glow} />
      <AppText color={colors.primaryContrast} style={styles.kicker} variant="label">
        {props.title}
      </AppText>
      <AppText color={colors.primaryContrast} style={styles.value} variant="display">
        {props.value}
      </AppText>
      <AppText color={colors.primaryContrast} style={styles.subtitle} variant="body">
        {props.subtitle}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.lg,
  },
  glow: {
    position: "absolute",
    top: -32,
    right: -6,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  kicker: {
    opacity: 0.9,
  },
  value: {
    letterSpacing: -1,
  },
  subtitle: {
    opacity: 0.92,
  },
});

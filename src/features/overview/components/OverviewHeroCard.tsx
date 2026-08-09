import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

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
          backgroundColor: colors.primary,
          borderColor: colors.primaryStrong,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <Text style={[styles.kicker, { color: colors.primaryContrast }]}>{props.title}</Text>
      <Text style={[styles.value, { color: colors.primaryContrast }]}>{props.value}</Text>
      <Text style={[styles.subtitle, { color: colors.primaryContrast }]}>{props.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.xs,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.9,
  },
  value: {
    fontSize: 34,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.92,
  },
});

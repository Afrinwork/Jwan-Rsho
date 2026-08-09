import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type HeroPanelProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
  rightSlot?: ReactNode;
};

export function HeroPanel(props: HeroPanelProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, shadowColor: colors.shadow }]}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{props.eyebrow}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{props.title}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>{props.subtitle}</Text>
        </View>
        {props.rightSlot}
      </View>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
});

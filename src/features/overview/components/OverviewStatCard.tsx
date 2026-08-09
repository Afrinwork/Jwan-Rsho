import { ComponentType } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type IconProps = {
  color: string;
  size: number;
};

type OverviewStatCardProps = {
  title: string;
  value: string;
  caption: string;
  icon: ComponentType<IconProps>;
  accent?: "primary" | "success";
  onPress?: () => void;
};

export function OverviewStatCard(props: OverviewStatCardProps) {
  const colors = useThemeColors();
  const accentColor = props.accent === "success" ? colors.success : colors.primary;
  const cardStyle = {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    shadowColor: colors.shadow,
  };

  const content = (
    <>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
          <props.icon color={accentColor} size={20} />
        </View>
        <Text style={[styles.title, { color: colors.mutedText }]}>{props.title}</Text>
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{props.value}</Text>
      <Text style={[styles.caption, { color: colors.mutedText }]}>{props.caption}</Text>
    </>
  );

  if (props.onPress) {
    return (
      <Pressable onPress={props.onPress} style={({ pressed }) => [styles.card, cardStyle, { opacity: pressed ? 0.96 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.card, cardStyle]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "47%",
    borderWidth: 1,
    borderRadius: 22,
    padding: spacing.md,
    gap: spacing.xs,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  value: {
    fontSize: 28,
    fontWeight: "800",
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
  },
});

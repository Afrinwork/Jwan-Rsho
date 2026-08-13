import { ComponentType } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type IconProps = {
  color: string;
  size: number;
};

type OverviewStatCardProps = {
  title: string;
  value: string;
  caption: string;
  icon: ComponentType<IconProps>;
  accent?: "primary" | "success" | "danger";
  onPress?: () => void;
};

export function OverviewStatCard(props: OverviewStatCardProps) {
  const colors = useThemeColors();
  const accentColor = props.accent === "success" ? colors.success : props.accent === "danger" ? colors.danger : colors.primary;
  const accentBackground = props.accent === "success"
    ? colors.successBackground
    : props.accent === "danger"
      ? colors.dangerBackground
      : colors.primaryMuted;
  const content = (
    <AppCard contentStyle={styles.cardContent}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: accentBackground }]}>
          <props.icon color={accentColor} size={20} />
        </View>
        <AppText color="muted" style={styles.title} variant="label">
          {props.title}
        </AppText>
      </View>
      <AppText style={styles.value} variant="title">
        {props.value}
      </AppText>
      <AppText color="muted" style={styles.caption} variant="caption">
        {props.caption}
      </AppText>
    </AppCard>
  );

  if (props.onPress) {
    return (
      <Pressable onPress={props.onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.96 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "47%",
  },
  cardContent: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
  },
  value: {},
  caption: {},
});

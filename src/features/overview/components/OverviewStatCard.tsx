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
    <AppCard contentStyle={styles.cardContent} style={{ shadowColor: accentColor }}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: accentBackground, borderColor: colors.border }]}>
          <props.icon color={accentColor} size={20} />
        </View>
      </View>
      <View style={styles.copy}>
        <AppText style={styles.value} variant="title">
          {props.value}
        </AppText>
        <AppText color="muted" numberOfLines={1} style={styles.title} variant="label">
          {props.title}
        </AppText>
        <AppText color="muted" numberOfLines={2} style={styles.caption} variant="caption">
          {props.caption}
        </AppText>
      </View>
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
    minHeight: 136,
    padding: spacing.md,
    gap: spacing.sm,
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    gap: 2,
  },
  title: {
    fontWeight: "700",
  },
  value: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "800",
  },
  caption: {
    lineHeight: 18,
  },
});

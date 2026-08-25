import {
  ArrowRight20Regular,
  Box20Regular,
  Building20Regular,
  ClipboardBulletList20Regular,
} from "@fluentui/react-native-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";

type ManagementMenuButtonProps = {
  title: string;
  subtitle: string;
  onPress: () => void;
  icon?: "products" | "countries" | "catalog";
  meta?: string;
};

export function ManagementMenuButton(props: ManagementMenuButtonProps) {
  const colors = useThemeColors();
  const Icon = resolveIcon(props.icon);

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.pressable,
        {
          opacity: pressed ? 0.96 : 1,
          transform: [{ scale: pressed ? 0.992 : 1 }],
        },
      ]}
    >
      <AppCard contentStyle={styles.card} tone="surface">
        <View style={[styles.leading, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Icon color={colors.text} />
        </View>
        <View style={styles.copy}>
          {props.meta ? (
            <AppText color="muted" variant="caption">
              {props.meta}
            </AppText>
          ) : null}
          <AppText variant="subheading">{props.title}</AppText>
          <AppText color="muted" variant="caption">
            {props.subtitle}
          </AppText>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted, borderColor: colors.border }]}>
          <ArrowRight20Regular color={colors.primary} />
        </View>
      </AppCard>
    </Pressable>
  );
}

function resolveIcon(icon: ManagementMenuButtonProps["icon"]) {
  if (icon === "countries") {
    return Building20Regular;
  }

  if (icon === "catalog") {
    return ClipboardBulletList20Regular;
  }

  return Box20Regular;
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.card,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.lg,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  leading: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 4 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

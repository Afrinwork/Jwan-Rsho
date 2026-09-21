import { ChevronRight20Regular } from "@fluentui/react-native-icons";
import { I18nManager, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { spacing } from "@/src/theme/spacing";

type OverviewActionRowProps = {
  label: string;
  value: string;
  description: string;
  onPress: () => void;
  primary?: boolean;
};

export function OverviewActionRow({ label, value, description, onPress, primary = false }: OverviewActionRowProps) {
  const colors = useThemeColors();
  const chevronStyle = I18nManager.isRTL ? styles.chevronRtl : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: primary ? colors.primaryMuted : colors.background,
          borderColor: colors.border,
          flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <AppText style={[styles.value, { color: primary ? colors.primary : colors.text }]} variant="title">
        {value}
      </AppText>
      <View style={styles.copy}>
        <AppText numberOfLines={1} variant="bodyMedium">
          {label}
        </AppText>
        <AppText color="muted" numberOfLines={1} variant="caption">
          {description}
        </AppText>
      </View>
      <ChevronRight20Regular color={colors.mutedText} style={chevronStyle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 72,
    paddingHorizontal: spacing.md,
  },
  value: {
    minWidth: 40,
    textAlign: "center",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  chevronRtl: {
    transform: [{ scaleX: -1 }],
  },
});

import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { typography } from "@/src/theme/typography";

type ManagementSectionMode = "list" | "create";

type ManagementSectionShellProps = {
  title: string;
  subtitle: string;
  listLabel: string;
  createLabel: string;
  mode: ManagementSectionMode;
  onModeChange: (mode: ManagementSectionMode) => void;
  children: ReactNode;
};

export function ManagementSectionShell(props: ManagementSectionShellProps) {
  const colors = useThemeColors();
  const showHeader = Boolean(props.title.trim() || props.subtitle.trim());

  return (
    <AppCard contentStyle={styles.card} style={{ shadowColor: colors.shadow }}>
      {showHeader ? (
        <View style={styles.header}>
          <AppText variant="heading">{props.title}</AppText>
          <AppText color="muted" variant="body">{props.subtitle}</AppText>
        </View>
      ) : null}
      <View style={[styles.switchRow, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <ModeButton
          active={props.mode === "list"}
          color={colors.primary}
          label={props.listLabel}
          onPress={() => props.onModeChange("list")}
        />
        <ModeButton
          active={props.mode === "create"}
          color={colors.primary}
          label={props.createLabel}
          onPress={() => props.onModeChange("create")}
        />
      </View>
      {props.children}
    </AppCard>
  );
}

function ModeButton(props: { active: boolean; label: string; onPress: () => void; color: string }) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.modeButton,
        {
          backgroundColor: props.active ? props.color : "transparent",
          borderColor: props.active ? props.color : "transparent",
        },
      ]}
    >
      <AppText style={[styles.modeLabel, { color: props.active ? colors.primaryContrast : colors.text }]} variant="bodyMedium">
        {props.label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  switchRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  modeLabel: {
    ...typography.label,
  },
});

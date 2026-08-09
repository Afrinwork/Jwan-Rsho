import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

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

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{props.title}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>{props.subtitle}</Text>
      </View>
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
    </View>
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
        },
      ]}
    >
      <Text style={[styles.modeLabel, { color: props.active ? colors.primaryContrast : colors.text }]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 18,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
});

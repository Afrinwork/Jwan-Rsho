import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

export type ManagementWorkspaceId = "products" | "countries" | "regions" | "seed";

type ManagementWorkspaceTabsProps = {
  active: ManagementWorkspaceId;
  onChange: (value: ManagementWorkspaceId) => void;
};

export function ManagementWorkspaceTabs(props: ManagementWorkspaceTabsProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("management");

  const items: { id: ManagementWorkspaceId; label: string }[] = [
    { id: "products", label: t("workspaceTabs.products") },
    { id: "countries", label: t("workspaceTabs.countries") },
    { id: "regions", label: t("workspaceTabs.regions") },
    { id: "seed", label: t("workspaceTabs.catalog") },
  ];

  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const active = item.id === props.active;

        return (
          <Pressable
            key={item.id}
            onPress={() => props.onChange(item.id)}
            style={[
              styles.tile,
              {
                backgroundColor: active ? colors.primary : colors.surfaceElevated,
                borderColor: active ? colors.primaryStrong : colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Text style={[styles.tileLabel, { color: active ? colors.primaryContrast : colors.text }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tile: {
    minWidth: 120,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  tileLabel: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
});

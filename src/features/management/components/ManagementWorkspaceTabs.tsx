import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

export type ManagementWorkspaceId = "products" | "countries" | "seed";

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
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: active ? colors.primary : colors.surfaceElevated,
                borderColor: active ? colors.primaryStrong : colors.border,
                opacity: pressed ? 0.72 : 1,
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
    backgroundColor: "transparent",
    flexDirection: "row",
    gap: 4,
  },
  tile: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.xs,
  },
  tileLabel: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
});

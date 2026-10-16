import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { mapT } from "@/src/features/map/i18n/mapT";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";

export type MapCategory = "overview" | "filters" | "selection" | "trip";

type MapCategoryBarProps = {
  activeCategory: MapCategory | null;
  filterActive: boolean;
  selectedCount: number;
  tripCount: number;
  warningCount: number;
  onChange: (category: MapCategory | null) => void;
};

const items: { key: MapCategory; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: "overview", icon: "information-outline" },
  { key: "filters", icon: "filter-variant" },
  { key: "selection", icon: "selection-marker" },
  { key: "trip", icon: "map-marker-path" },
];

export function MapCategoryBar(props: MapCategoryBarProps) {
  const colors = useThemeColors();

  function badgeFor(category: MapCategory) {
    if (category === "overview") return props.warningCount || null;
    if (category === "filters") return props.filterActive ? "•" : null;
    if (category === "selection") return props.selectedCount || null;
    return props.tripCount || null;
  }

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {items.map((item) => {
        const active = props.activeCategory === item.key;
        const badge = badgeFor(item.key);
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: active }}
            key={item.key}
            onPress={() => props.onChange(active ? null : item.key)}
            style={[styles.item, active && { backgroundColor: colors.primaryMuted }]}
          >
            <View>
              <MaterialCommunityIcons color={active ? colors.primary : colors.textMuted} name={item.icon} size={21} />
              {badge ? (
                <View style={[styles.badge, { backgroundColor: item.key === "overview" ? colors.warning : colors.primary }]}>
                  <AppText color={colors.primaryContrast} style={styles.badgeText} variant="caption">{badge}</AppText>
                </View>
              ) : null}
            </View>
            <AppText color={active ? "primary" : "muted"} numberOfLines={1} style={styles.label} variant="caption">
              {mapT(`categories.${item.key}`)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  item: { alignItems: "center", borderRadius: radius.lg, flex: 1, gap: 2, minHeight: 48, justifyContent: "center" },
  label: { fontSize: 11, fontWeight: "700" },
  badge: { alignItems: "center", borderRadius: radius.pill, height: 17, justifyContent: "center", minWidth: 17, paddingHorizontal: 4, position: "absolute", right: -10, top: -6 },
  badgeText: { fontSize: 10, fontWeight: "800", lineHeight: 13 },
});

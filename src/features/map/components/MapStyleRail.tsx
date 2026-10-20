import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { mapT } from "@/src/features/map/i18n/mapT";
import { useMapStyleKind } from "@/src/features/map/hooks/useMapStyleKind";
import { MAP_STYLE_KINDS, MapStyleKind } from "@/src/features/map/types/mapViewTypes";
import { TripActionDockButton } from "@/src/features/route/components/TripActionDockButton";
import { TripActionMenu } from "@/src/features/route/components/TripActionMenu";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

const STYLE_ICONS: Record<MapStyleKind, keyof typeof MaterialCommunityIcons.glyphMap> = {
  light: "map-outline",
  standard: "map",
  satellite: "satellite-variant",
  hybrid: "map-legend",
};

type MapStyleRailProps = {
  // Absent without a GPS fix — then there is nothing to center on.
  onRecenter?: () => void;
};

// The map's own settings, kept behind icons on the right edge (like the trip
// panel's icon rail): the map look, and centering on the own position — the
// map no longer jumps there by itself when the app comes back.
export function MapStyleRail({ onRecenter }: MapStyleRailProps) {
  const t = mapT;
  const colors = useThemeColors();
  const { kind, setKind } = useMapStyleKind();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={styles.rail}>
        <TripActionDockButton active={menuOpen} icon="layers-outline" label={t("mapStyle.title")} onPress={() => setMenuOpen((open) => !open)} />
        {onRecenter ? <TripActionDockButton active={false} icon="crosshairs-gps" label={t("mapStyle.recenter")} onPress={onRecenter} /> : null}
      </View>
      {menuOpen ? (
        <View style={styles.menu}>
          <TripActionMenu icon="layers-outline" onClose={() => setMenuOpen(false)} subtitle={t("mapStyle.hint")} title={t("mapStyle.title")}>
            <View style={styles.options}>
              {MAP_STYLE_KINDS.map((option) => {
                const active = option === kind;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={option}
                    onPress={() => {
                      setKind(option);
                      setMenuOpen(false);
                    }}
                    style={[
                      styles.option,
                      { backgroundColor: active ? colors.primaryMuted : colors.surfaceElevated, borderColor: active ? colors.primary : colors.border },
                    ]}
                  >
                    <MaterialCommunityIcons color={active ? colors.primary : colors.text} name={STYLE_ICONS[option]} size={26} />
                    <AppText color={active ? "primary" : "default"} numberOfLines={1} variant="caption">
                      {t(`mapStyle.${option}`)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </TripActionMenu>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "flex-end", gap: spacing.xs },
  rail: { gap: spacing.xs },
  menu: { alignSelf: "stretch" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  option: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
  },
});

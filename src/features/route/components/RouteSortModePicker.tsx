import { ArrowReset20Regular } from "@fluentui/react-native-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { routeT } from "@/src/features/route/i18n/routeT";
import { ROUTE_SORT_MODES, RouteSortMode } from "@/src/features/route/services/routeSortModeService";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type RouteSortModePickerProps = {
  value: RouteSortMode;
  // A hand-made order is active — shown as its own (selected) chip, and
  // picking any preset replaces it.
  isManual: boolean;
  onChange: (mode: RouteSortMode) => void;
};

// "How should the route be ordered?" — picked before the trip starts,
// instead of the app deciding on its own.
export function RouteSortModePicker(props: RouteSortModePickerProps) {
  const t = routeT;
  const colors = useThemeColors();

  function chip(key: string, label: string, selected: boolean, onPress?: () => void) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        disabled={!onPress}
        key={key}
        onPress={onPress}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? colors.primary : colors.surfaceElevated,
            borderColor: selected ? colors.primaryStrong : colors.border,
          },
        ]}
      >
        <AppText color={selected ? colors.primaryContrast : colors.text} variant="caption">
          {label}
        </AppText>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <AppText color="muted" variant="label">
        {t("sortMode.title")}
      </AppText>
      <View style={styles.chips}>
        {props.isManual ? chip("manual", t("sortMode.manual"), true) : null}
        {ROUTE_SORT_MODES.map((mode) =>
          chip(mode, t(`sortMode.${mode}`), !props.isManual && props.value === mode, () => props.onChange(mode)),
        )}
      </View>
      <View style={styles.hintRow}>
        {props.isManual ? <ArrowReset20Regular color={colors.mutedText} /> : null}
        <AppText color="muted" style={styles.hint} variant="caption">
          {props.isManual ? t("sortMode.manualHint") : t(`sortMode.${props.value}Hint`)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  hintRow: { flexDirection: "row", alignItems: "center", gap: spacing.xxs },
  hint: { flex: 1 },
});

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";

type TripActionDockButtonProps = {
  active: boolean;
  badge?: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
};

export function TripActionDockButton(props: TripActionDockButtonProps) {
  const colors = useThemeColors();
  const foreground = props.active ? colors.primaryContrast : colors.text;

  return (
    <Pressable
      accessibilityLabel={props.label}
      accessibilityRole="button"
      accessibilityState={{ expanded: props.active }}
      onPress={props.onPress}
      style={[
        styles.button,
        {
          backgroundColor: props.active ? colors.primary : colors.surface,
          borderColor: props.active ? colors.primary : colors.border,
        },
      ]}
    >
      <MaterialCommunityIcons color={foreground} name={props.icon} size={23} />
      {props.badge ? (
        <View style={[styles.badge, { backgroundColor: colors.warning }]}>
          <AppText color={colors.primaryContrast} style={styles.badgeText} variant="caption">{props.badge}</AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: "center", borderRadius: radius.pill, borderWidth: 1, height: 46, justifyContent: "center", width: 46 },
  badge: { alignItems: "center", borderRadius: radius.pill, height: 18, justifyContent: "center", minWidth: 18, paddingHorizontal: 4, position: "absolute", right: -4, top: -5 },
  badgeText: { fontSize: 10, fontWeight: "800", lineHeight: 13 },
});

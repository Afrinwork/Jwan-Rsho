import {
  ArrowRight20Regular,
  Box20Regular,
  Building20Regular,
  ClipboardBulletList20Regular,
  MapPin20Regular,
  Person20Regular,
  VehicleTruckProfile20Regular,
} from "@fluentui/react-native-icons";
import { I18nManager, Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";

type ManagementMenuButtonProps = {
  title: string;
  subtitle: string;
  onPress: () => void;
  icon?: "products" | "countries" | "catalog" | "customers" | "cities" | "drivers";
};

export function ManagementMenuButton(props: ManagementMenuButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressed,
      ]}
    >
      <AppCard contentStyle={styles.card} tone="surface">
        <View style={[styles.leading, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          {renderIcon(props.icon, colors.text)}
        </View>
        <View style={styles.copy}>
          <AppText variant="subheading">{props.title}</AppText>
          <AppText color="muted" variant="caption">
            {props.subtitle}
          </AppText>
        </View>
        <ArrowRight20Regular color={colors.mutedText} style={I18nManager.isRTL ? styles.arrowRtl : undefined} />
      </AppCard>
    </Pressable>
  );
}

// Returns the icon element directly (rather than picking a component
// reference to render via a dynamic `<Icon />` tag) so the icon choice
// doesn't look like a component being defined during render.
function renderIcon(icon: ManagementMenuButtonProps["icon"], color: string) {
  if (icon === "countries") {
    return <Building20Regular color={color} />;
  }

  if (icon === "catalog") {
    return <ClipboardBulletList20Regular color={color} />;
  }

  if (icon === "customers") {
    return <Person20Regular color={color} />;
  }

  if (icon === "cities") {
    return <MapPin20Regular color={color} />;
  }

  if (icon === "drivers") {
    return <VehicleTruckProfile20Regular color={color} />;
  }

  return <Box20Regular color={color} />;
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: 76,
  },
  pressed: { opacity: 0.72 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: 76,
    padding: spacing.md,
  },
  leading: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 4 },
  arrowRtl: { transform: [{ scaleX: -1 }] },
});

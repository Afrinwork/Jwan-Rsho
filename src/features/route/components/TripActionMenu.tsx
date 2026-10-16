import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PropsWithChildren } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type TripActionMenuProps = PropsWithChildren<{
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  subtitle: string;
  title: string;
  onClose: () => void;
}>;

export function TripActionMenu(props: TripActionMenuProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.primaryMuted }]}>
          <MaterialCommunityIcons color={colors.primary} name={props.icon} size={22} />
        </View>
        <View style={styles.titleBlock}>
          <AppText numberOfLines={1} variant="bodyMedium">{props.title}</AppText>
          <AppText color="muted" numberOfLines={1} variant="caption">{props.subtitle}</AppText>
        </View>
        <Pressable accessibilityRole="button" onPress={props.onClose} style={styles.closeButton}>
          <MaterialCommunityIcons color={colors.textMuted} name="close" size={22} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.scroll}>
        {props.children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: { borderRadius: radius.xl, borderWidth: 1, overflow: "hidden" },
  header: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 62, padding: spacing.sm },
  icon: { alignItems: "center", borderRadius: radius.md, height: 40, justifyContent: "center", width: 40 },
  titleBlock: { flex: 1, gap: 1 },
  closeButton: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  scroll: { borderTopWidth: 1, borderTopColor: "#E5E5E5", maxHeight: 285 },
  content: { gap: spacing.sm, padding: spacing.sm },
});

import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type ManagementMenuButtonProps = {
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function ManagementMenuButton(props: ManagementMenuButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          opacity: pressed ? 0.95 : 1,
        },
      ]}
    >
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{props.title}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>{props.subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.md,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  copy: { gap: 4 },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { fontSize: 13, lineHeight: 18 },
});

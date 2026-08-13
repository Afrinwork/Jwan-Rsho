import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowRight20Regular } from "@fluentui/react-native-icons";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";

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
      style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.96 : 1 }]}
    >
      <AppCard contentStyle={styles.card} tone="surface">
        <View style={styles.copy}>
          <AppText variant="subheading">{props.title}</AppText>
          <AppText color="muted" variant="caption">
            {props.subtitle}
          </AppText>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted, borderColor: colors.border }]}>
          <ArrowRight20Regular color={colors.primary} />
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.card,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.md,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  copy: { flex: 1, gap: 4 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type CompactScreenHeaderProps = {
  title: string;
  subtitle?: string;
  chips?: ReactNode;
  rightSlot?: ReactNode;
};

export function CompactScreenHeader(props: CompactScreenHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.text }]}>{props.title}</Text>
          {props.subtitle ? (
            <Text numberOfLines={2} style={[styles.subtitle, { color: colors.mutedText }]}>
              {props.subtitle}
            </Text>
          ) : null}
        </View>
        {props.rightSlot}
      </View>
      {props.chips ? <View style={styles.chips}>{props.chips}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  chips: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
});

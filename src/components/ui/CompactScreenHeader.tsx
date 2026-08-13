import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/theme/spacing";

type CompactScreenHeaderProps = {
  title: string;
  subtitle?: string;
  chips?: ReactNode;
  rightSlot?: ReactNode;
};

export function CompactScreenHeader(props: CompactScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <AppText style={styles.title} variant="heading">
            {props.title}
          </AppText>
          {props.subtitle ? (
            <AppText color="muted" numberOfLines={2} style={styles.subtitle} variant="caption">
              {props.subtitle}
            </AppText>
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
  title: {},
  subtitle: {},
  chips: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
});

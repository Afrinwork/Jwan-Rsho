import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/theme/spacing";

type HeroPanelProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
  rightSlot?: ReactNode;
};

export function HeroPanel(props: HeroPanelProps) {
  return (
    <AppCard contentStyle={styles.card} frosted tone="primary">
      <View style={styles.row}>
        <View style={styles.copy}>
          <AppText color="primary" style={styles.eyebrow} variant="label">
            {props.eyebrow}
          </AppText>
          <AppText style={styles.title} variant="title">
            {props.title}
          </AppText>
          <AppText color="muted" style={styles.subtitle} variant="body">
            {props.subtitle}
          </AppText>
        </View>
        {props.rightSlot}
      </View>
      {props.children}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 8,
  },
  eyebrow: {
    letterSpacing: 1.4,
  },
  title: {},
  subtitle: {},
});

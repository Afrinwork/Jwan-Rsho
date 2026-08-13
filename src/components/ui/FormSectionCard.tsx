import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/theme/spacing";

type FormSectionCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function FormSectionCard({ title, subtitle, children }: FormSectionCardProps) {
  return (
    <AppCard contentStyle={styles.card}>
      <View style={styles.header}>
        <AppText variant="subheading">{title}</AppText>
        {subtitle ? (
          <AppText color="muted" variant="caption">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {children}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    gap: 4,
  },
});

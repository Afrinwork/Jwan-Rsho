import { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/theme/spacing";

type SettingsSectionProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
}>;

export function SettingsSection({ title, subtitle, children }: SettingsSectionProps) {
  return (
    <AppCard contentStyle={styles.card}>
      <AppText variant="subheading">{title}</AppText>
      {subtitle ? (
        <AppText color="muted" variant="caption">
          {subtitle}
        </AppText>
      ) : null}
      {children}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
});

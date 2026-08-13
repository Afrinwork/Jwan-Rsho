import { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/theme/spacing";

type SettingsSectionProps = PropsWithChildren<{
  title: string;
}>;

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <AppCard contentStyle={styles.card} frosted>
      <AppText variant="subheading">{title}</AppText>
      {children}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.sm,
  },
});

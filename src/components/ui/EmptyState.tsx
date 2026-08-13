import { StyleSheet } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/theme/spacing";

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <AppCard contentStyle={styles.container} frosted>
      <AppText variant="heading">{title}</AppText>
      <AppText color="muted" variant="body">
        {message}
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    padding: spacing.lg,
  },
});

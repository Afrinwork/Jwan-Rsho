import { StyleSheet } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";

type InfoCardProps = {
  label: string;
  value: string | number;
};

export function InfoCard({ label, value }: InfoCardProps) {
  return (
    <AppCard contentStyle={styles.card}>
      <AppText color="muted" variant="label">
        {label}
      </AppText>
      <AppText variant="heading">{value}</AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 6,
  },
});

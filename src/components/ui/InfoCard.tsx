import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/constants/colors";
import { spacing } from "@/src/constants/spacing";

type InfoCardProps = {
  label: string;
  value: string | number;
};

export function InfoCard({ label, value }: InfoCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    gap: 6,
  },
  label: {
    color: colors.mutedText,
    fontSize: 14,
  },
  value: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
});

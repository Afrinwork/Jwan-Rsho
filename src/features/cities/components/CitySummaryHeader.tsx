import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/constants/colors";

type CitySummaryHeaderProps = {
  cityCount: number;
  title?: string;
  subtitle?: string;
};

export function CitySummaryHeader({ cityCount, title = "Staedte", subtitle }: CitySummaryHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle ?? `${cityCount} Staedte aus Kundendaten abgeleitet`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  title: { color: colors.text, fontSize: 24, fontWeight: "700" },
  subtitle: { color: colors.mutedText, fontSize: 14 },
});

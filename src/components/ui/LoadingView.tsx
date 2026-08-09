import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/constants/colors";

type LoadingViewProps = {
  label?: string;
};

export function LoadingView({ label = "Wird geladen..." }: LoadingViewProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  label: {
    color: colors.mutedText,
    fontSize: 16,
  },
});

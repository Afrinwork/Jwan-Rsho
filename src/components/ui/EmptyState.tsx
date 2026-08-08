import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/constants/colors";

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  message: {
    color: colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
  },
});

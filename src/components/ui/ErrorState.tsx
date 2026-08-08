import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/constants/colors";

type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    padding: 12,
  },
  label: {
    color: colors.danger,
    fontSize: 14,
  },
});

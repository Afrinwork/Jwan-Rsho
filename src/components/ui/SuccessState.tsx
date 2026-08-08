import { StyleSheet, Text, View } from "react-native";

type SuccessStateProps = {
  message: string;
};

export function SuccessState({ message }: SuccessStateProps) {
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
    borderColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
    padding: 12,
  },
  label: {
    color: "#166534",
    fontSize: 14,
  },
});

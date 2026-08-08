import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/src/components/ui/AppButton";
import { routes } from "@/src/constants/routes";

export function AdminActions() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AppButton label="Benutzer anlegen" onPress={() => router.push(routes.adminCreateUser)} />
      <AppButton
        label="Benutzer endgueltig loeschen"
        onPress={() => router.push(routes.adminUsers)}
        variant="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});

import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { routes } from "@/src/constants/routes";
import { spacing } from "@/src/constants/spacing";

export function OverviewQuickActions() {
  const router = useRouter();

  return (
    <View style={styles.actions}>
      <AppButton label="Neue Bestellung" onPress={() => router.push(routes.add)} />
      <AppButton label="Staedte oeffnen" onPress={() => router.push(routes.cities)} variant="secondary" />
      <AppButton label="Verwaltung" onPress={() => router.push(routes.management)} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
});

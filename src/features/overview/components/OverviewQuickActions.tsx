import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { routes } from "@/src/constants/routes";
import { spacing } from "@/src/constants/spacing";

export function OverviewQuickActions() {
  const { t } = useTranslation("overview");
  const router = useRouter();

  return (
    <View style={styles.actions}>
      <AppButton label={t("quickActions.newOrder")} onPress={() => router.push(routes.add)} />
      <AppButton label={t("quickActions.openCities")} onPress={() => router.push(routes.cities)} variant="secondary" />
      <AppButton label={t("quickActions.management")} onPress={() => router.push(routes.management)} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
});

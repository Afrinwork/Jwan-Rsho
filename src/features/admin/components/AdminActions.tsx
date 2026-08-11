import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { routes } from "@/src/constants/routes";

export function AdminActions() {
  const router = useRouter();
  const { t } = useTranslation("admin");

  return (
    <View style={styles.container}>
      <AppButton label={t("actions.createUser")} onPress={() => router.push(routes.adminCreateUser)} />
      <AppButton
        label={t("actions.deleteUser")}
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

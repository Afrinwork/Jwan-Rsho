import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { AppButton } from "@/src/components/ui/AppButton";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { routes } from "@/src/constants/routes";
import { spacing } from "@/src/constants/spacing";
import { ManagementMenuButton } from "@/src/features/management/components/ManagementMenuButton";
import { useAuthStore } from "@/src/store/authStore";

export function ManagementScreen() {
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const router = useRouter();
  const { t } = useTranslation("management");

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AnimatedEntrance>
          <CompactScreenHeader
            rightSlot={
              isAdmin ? (
                <AppButton label={t("screen.adminButton")} onPress={() => router.push(routes.admin)} variant="secondary" />
              ) : null
            }
            subtitle={t("screen.subtitle")}
            title={t("screen.title")}
          />
        </AnimatedEntrance>
        <AnimatedEntrance delay={50} style={styles.menu}>
          <ManagementMenuButton
            onPress={() => router.push(routes.managementProducts)}
            subtitle={t("menu.products.subtitle")}
            title={t("menu.products.title")}
          />
          <ManagementMenuButton
            onPress={() => router.push("/management/countries" as never)}
            subtitle={t("menu.countries.subtitle")}
            title={t("menu.countries.title")}
          />
          <ManagementMenuButton
            onPress={() => router.push(routes.managementRegions)}
            subtitle={t("menu.regions.subtitle")}
            title={t("menu.regions.title")}
          />
          <ManagementMenuButton
            onPress={() => router.push(routes.managementCatalog)}
            subtitle={t("menu.catalog.subtitle")}
            title={t("menu.catalog.title")}
          />
        </AnimatedEntrance>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  menu: {
    gap: spacing.sm,
  },
});

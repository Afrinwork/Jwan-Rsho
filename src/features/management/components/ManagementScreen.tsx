import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { routes } from "@/src/constants/routes";
import { spacing } from "@/src/constants/spacing";
import { canManageAdmins } from "@/src/features/auth/permissions";
import { ManagementMenuButton } from "@/src/features/management/components/ManagementMenuButton";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";

export function ManagementScreen() {
  const router = useRouter();
  const { t } = useTranslation("management");
  const currentUser = useCurrentUser();
  const canSeeAdmins = canManageAdmins(currentUser);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AnimatedEntrance>
          <CompactScreenHeader subtitle={t("screen.subtitle")} title={t("screen.title")} />
        </AnimatedEntrance>
        <AnimatedEntrance delay={30} style={styles.menu}>
          <ManagementMenuButton
            icon="products"
            onPress={() => router.push(routes.managementProducts)}
            subtitle={t("menu.products.subtitle")}
            title={t("menu.products.title")}
          />
          <ManagementMenuButton
            icon="customers"
            onPress={() => router.push(routes.managementCustomers)}
            subtitle={t("menu.customers.subtitle")}
            title={t("menu.customers.title")}
          />
          <ManagementMenuButton
            icon="cities"
            onPress={() => router.push(routes.cityList)}
            subtitle={t("menu.cities.subtitle")}
            title={t("menu.cities.title")}
          />
          <ManagementMenuButton
            icon="countries"
            onPress={() => router.push("/management/countries" as never)}
            subtitle={t("menu.countries.subtitle")}
            title={t("menu.countries.title")}
          />
          <ManagementMenuButton
            icon="catalog"
            onPress={() => router.push(routes.managementCatalog)}
            subtitle={t("menu.catalog.subtitle")}
            title={t("menu.catalog.title")}
          />
          <ManagementMenuButton
            icon="drivers"
            onPress={() => router.push(routes.managementDrivers)}
            subtitle={t("menu.drivers.subtitle")}
            title={t("menu.drivers.title")}
          />
          <ManagementMenuButton
            icon="catalog"
            onPress={() => router.push(routes.managementWhatsapp)}
            subtitle={t("menu.whatsapp.subtitle")}
            title={t("menu.whatsapp.title")}
          />
          {canSeeAdmins ? (
            <ManagementMenuButton
              icon="customers"
              onPress={() => router.push(routes.managementAdmins)}
              subtitle={t("menu.admins.subtitle")}
              title={t("menu.admins.title")}
            />
          ) : null}
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
    gap: spacing.md,
  },
});

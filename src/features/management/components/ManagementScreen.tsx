import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

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

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AnimatedEntrance>
          <CompactScreenHeader
            rightSlot={isAdmin ? <AppButton label="Admin" onPress={() => router.push(routes.admin)} variant="secondary" /> : null}
            subtitle="Waehle einen Bereich."
            title="Verwaltung"
          />
        </AnimatedEntrance>
        <AnimatedEntrance delay={50} style={styles.menu}>
          <ManagementMenuButton
            onPress={() => router.push(routes.managementProducts)}
            subtitle="Produkte hinzufuegen, ansehen, bearbeiten und loeschen."
            title="Produkte"
          />
          <ManagementMenuButton
            onPress={() => router.push("/management/countries" as never)}
            subtitle="Laender pflegen, aktivieren, deaktivieren und loeschen."
            title="Laender"
          />
          <ManagementMenuButton
            onPress={() => router.push(routes.managementRegions)}
            subtitle="Regionen passend zu Laendern verwalten."
            title="Regionen"
          />
          <ManagementMenuButton
            onPress={() => router.push(routes.managementCatalog)}
            subtitle="Beispiel-Katalog fuer neue Nutzung laden."
            title="Katalog laden"
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

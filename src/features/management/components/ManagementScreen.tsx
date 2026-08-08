import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/src/components/ui/AppButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { colors } from "@/src/constants/colors";
import { routes } from "@/src/constants/routes";
import { spacing } from "@/src/constants/spacing";
import { CountryManagementSection } from "@/src/features/countries/components/CountryManagementSection";
import { ProductManagementSection } from "@/src/features/products/components/ProductManagementSection";
import { RegionManagementSection } from "@/src/features/regions/components/RegionManagementSection";
import { useAuthStore } from "@/src/store/authStore";

export function ManagementScreen() {
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const router = useRouter();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Verwaltung</Text>
          <Text style={styles.body}>Phase 1 haelt diesen Bereich klein und reserviert Admin-Zusatzaktionen sauber getrennt.</Text>
        </View>
        {isAdmin ? <AppButton label="Admin Dashboard" onPress={() => router.push(routes.admin)} variant="secondary" /> : null}
        <ProductManagementSection />
        <CountryManagementSection />
        <RegionManagementSection />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  body: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
});

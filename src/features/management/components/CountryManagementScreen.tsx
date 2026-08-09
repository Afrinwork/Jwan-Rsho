import { ScrollView, StyleSheet } from "react-native";

import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { spacing } from "@/src/constants/spacing";
import { CountryManagementSection } from "@/src/features/countries/components/CountryManagementSection";

export function CountryManagementScreen() {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CountryManagementSection />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
});

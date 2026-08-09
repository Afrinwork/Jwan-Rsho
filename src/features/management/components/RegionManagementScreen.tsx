import { ScrollView, StyleSheet } from "react-native";

import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { spacing } from "@/src/constants/spacing";
import { RegionManagementSection } from "@/src/features/regions/components/RegionManagementSection";

export function RegionManagementScreen() {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <RegionManagementSection />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
});

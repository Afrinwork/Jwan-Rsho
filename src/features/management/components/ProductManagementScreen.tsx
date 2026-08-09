import { ScrollView, StyleSheet } from "react-native";

import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { spacing } from "@/src/constants/spacing";
import { ProductManagementSection } from "@/src/features/products/components/ProductManagementSection";

export function ProductManagementScreen() {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProductManagementSection />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
});

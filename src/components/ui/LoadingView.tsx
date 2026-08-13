import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { spacing } from "@/src/theme/spacing";

type LoadingViewProps = {
  label?: string;
};

export function LoadingView({ label = "Wird geladen..." }: LoadingViewProps) {
  const colors = useThemeColors();

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} size="large" />
        <AppText color="muted" variant="body">
          {label}
        </AppText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
});

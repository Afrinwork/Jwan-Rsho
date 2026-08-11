import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "@/src/hooks/useThemeColors";

export default function AuthLayout() {
  const colors = useThemeColors();
  const { t } = useTranslation("navigation");

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.surfaceElevated,
        },
        headerTitleStyle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: "700",
        },
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ title: t("stack.forgotPassword") }} />
    </Stack>
  );
}

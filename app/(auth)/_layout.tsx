import { Stack } from "expo-router";

import { useThemeColors } from "@/src/hooks/useThemeColors";

export default function AuthLayout() {
  const colors = useThemeColors();

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
      <Stack.Screen name="forgot-password" options={{ title: "Passwort zuruecksetzen" }} />
    </Stack>
  );
}

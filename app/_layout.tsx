import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "@/src/components/layout/AppProviders";
import { AuthGate } from "@/src/components/layout/AuthGate";
import { useThemeColors } from "@/src/hooks/useThemeColors";

export default function RootLayout() {
  const colors = useThemeColors();

  return (
    <AppProviders>
      <AuthGate>
        <StatusBar style="auto" />
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
            headerShown: true,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="admin/index" options={{ title: "Admin Dashboard" }} />
          <Stack.Screen name="admin/create-user" options={{ title: "Benutzer anlegen" }} />
          <Stack.Screen name="admin/users" options={{ title: "Benutzer loeschen" }} />
          <Stack.Screen name="management/products" options={{ title: "Produkte" }} />
          <Stack.Screen name="management/countries" options={{ title: "Laender" }} />
          <Stack.Screen name="management/regions" options={{ title: "Regionen" }} />
          <Stack.Screen name="management/catalog" options={{ title: "Katalog laden" }} />
          <Stack.Screen name="cities/index" options={{ title: "Staedte" }} />
          <Stack.Screen name="city/[city]" options={{ title: "Stadt" }} />
          <Stack.Screen name="customer/[id]" options={{ title: "Kunde" }} />
          <Stack.Screen name="customer/edit/[id]" options={{ title: "Kunde bearbeiten" }} />
          <Stack.Screen name="order/[id]" options={{ title: "Bestellung" }} />
        </Stack>
      </AuthGate>
    </AppProviders>
  );
}

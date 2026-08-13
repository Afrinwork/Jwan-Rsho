import "@/src/i18n/i18n";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";

import { AppProviders } from "@/src/components/layout/AppProviders";
import { AuthGate } from "@/src/components/layout/AuthGate";
import { useAppTheme } from "@/src/hooks/useAppTheme";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { typography } from "@/src/theme/typography";

export default function RootLayout() {
  const theme = useAppTheme();
  const colors = useThemeColors();
  const { t } = useTranslation("navigation");

  return (
    <AppProviders>
      <AuthGate>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerBackButtonDisplayMode: "minimal",
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: colors.surfaceElevated,
            },
            headerTitleStyle: {
              color: colors.text,
              ...typography.bodyMedium,
            },
            headerLargeTitleShadowVisible: false,
            headerTintColor: colors.primary,
            headerShown: true,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="admin/index" options={{ title: t("stack.adminDashboard") }} />
          <Stack.Screen name="admin/create-user" options={{ title: t("stack.createUser") }} />
          <Stack.Screen name="admin/users" options={{ title: t("stack.deleteUsers") }} />
          <Stack.Screen name="management/products" options={{ title: t("stack.products") }} />
          <Stack.Screen name="management/countries" options={{ title: t("stack.countries") }} />
          <Stack.Screen name="management/regions" options={{ title: t("stack.regions") }} />
          <Stack.Screen name="management/catalog" options={{ title: t("stack.catalog") }} />
          <Stack.Screen name="cities/index" options={{ title: t("stack.cities") }} />
          <Stack.Screen name="city/[city]" options={{ title: t("stack.city") }} />
          <Stack.Screen name="customer/[id]" options={{ title: t("stack.customer") }} />
          <Stack.Screen name="customer/edit/[id]" options={{ title: t("stack.customerEdit") }} />
          <Stack.Screen name="order/[id]" options={{ title: t("stack.order") }} />
          <Stack.Screen name="orders/open" options={{ title: t("stack.openOrders") }} />
        </Stack>
      </AuthGate>
    </AppProviders>
  );
}

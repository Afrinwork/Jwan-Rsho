import "@/src/i18n/i18n";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";

import { AppProviders } from "@/src/components/layout/AppProviders";
import { AuthGate } from "@/src/components/layout/AuthGate";
import { canAccessFullApp } from "@/src/features/auth/permissions";
import { useAppTheme } from "@/src/hooks/useAppTheme";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { useAuthStore } from "@/src/store/authStore";
import { typography } from "@/src/theme/typography";

export default function RootLayout() {
  const theme = useAppTheme();
  const colors = useThemeColors();
  const { t } = useTranslation("navigation");
  const currentUser = useAuthStore((state) => state.currentUser);
  const currentUserId = currentUser?.uid ?? null;
  const isAuthenticated = currentUser !== null;
  const isManager = canAccessFullApp(currentUser);

  return (
    <AppProviders>
      <AuthGate>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        {/* Keying on the uid forces a full remount on every account switch, so no
            screen can hold onto a customer/order id fetched under a previous
            account — a stale id like that gets denied by Firestore's ownerId
            rules and used to surface as a "forbidden" error on the map. */}
        <Stack
          key={currentUserId ?? "signed-out"}
          screenOptions={{
            headerBackButtonDisplayMode: "minimal",
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: colors.surfaceElevated,
            },
            headerTitleStyle: {
              color: colors.text,
              ...typography.subheading,
            },
            headerLargeTitleShadowVisible: false,
            headerTintColor: colors.primary,
            headerShown: true,
          }}
        >
          {/* Protected groups instead of unmounting the navigator for a
              redirect: a screen whose guard is false can't be shown at all
              (expo-router falls back to the first allowed one), so a
              signed-out device never mounts a screen whose data hooks need a
              session — and the navigator itself stays mounted throughout. */}
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="customer/[id]" options={{ title: t("stack.customer") }} />
            <Stack.Screen name="customer/edit/[id]" options={{ title: t("stack.customerEdit") }} />
            <Stack.Screen name="order/[id]" options={{ title: t("stack.order") }} />
            <Stack.Screen name="map/route" options={{ title: t("stack.route") }} />
            <Stack.Screen name="map/route/live" options={{ headerShown: false }} />
            <Stack.Protected guard={isManager}>
              <Stack.Screen name="admin/create-user" options={{ title: t("stack.createUser") }} />
              <Stack.Screen name="admin/users" options={{ title: t("stack.deleteUsers") }} />
              <Stack.Screen name="management/customers" options={{ title: t("stack.customers") }} />
              <Stack.Screen name="management/products" options={{ title: t("stack.products") }} />
              <Stack.Screen name="management/countries" options={{ title: t("stack.countries") }} />
              <Stack.Screen name="management/catalog" options={{ title: t("stack.catalog") }} />
              <Stack.Screen name="management/drivers" options={{ title: t("stack.drivers") }} />
              <Stack.Screen name="management/admins" options={{ title: t("stack.admins") }} />
              <Stack.Screen name="management/whatsapp" options={{ title: t("stack.whatsappTemplate") }} />
              <Stack.Screen name="management/driver-map" options={{ title: t("stack.driverMap") }} />
              <Stack.Screen name="cities/index" options={{ title: t("stack.cities") }} />
              <Stack.Screen name="city/[city]" options={{ title: t("stack.city") }} />
              <Stack.Screen name="orders/open" options={{ title: t("stack.openOrders") }} />
            </Stack.Protected>
          </Stack.Protected>
        </Stack>
      </AuthGate>
    </AppProviders>
  );
}

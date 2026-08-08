import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "@/src/components/layout/AppProviders";
import { AuthGate } from "@/src/components/layout/AuthGate";

export default function RootLayout() {
  return (
    <AppProviders>
      <AuthGate>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGate>
    </AppProviders>
  );
}

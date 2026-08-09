import { PropsWithChildren } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { SettingsBootstrap } from "@/src/features/settings/components/SettingsBootstrap";
import { useAppTheme } from "@/src/hooks/useAppTheme";
import { StartupSplash } from "@/src/components/layout/StartupSplash";

export function AppProviders({ children }: PropsWithChildren) {
  const theme = useAppTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
        <SettingsBootstrap />
        {children}
        <StartupSplash />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

import { PropsWithChildren, useEffect } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppErrorBoundary } from "@/src/components/layout/AppErrorBoundary";
import { SettingsBootstrap } from "@/src/features/settings/components/SettingsBootstrap";
import { useAppTheme } from "@/src/hooks/useAppTheme";
import { ensureArabicRTL } from "@/src/i18n/languageController";
import { StartupSplash } from "@/src/components/layout/StartupSplash";
import { useThemeColors } from "@/src/hooks/useThemeColors";

export function AppProviders({ children }: PropsWithChildren) {
  const theme = useAppTheme();
  const colors = useThemeColors();

  useEffect(() => {
    void ensureArabicRTL();
  }, []);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const navigationTheme = theme === "dark"
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.surfaceElevated,
          border: colors.border,
          primary: colors.primary,
          text: colors.text,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.surfaceElevated,
          border: colors.border,
          primary: colors.primary,
          text: colors.text,
        },
      };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <SettingsBootstrap />
          <AppErrorBoundary>
            {children}
            <StartupSplash />
          </AppErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

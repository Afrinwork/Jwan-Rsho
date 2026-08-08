import { PropsWithChildren } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useAppTheme } from "@/src/hooks/useAppTheme";

export function AppProviders({ children }: PropsWithChildren) {
  const theme = useAppTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
        {children}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

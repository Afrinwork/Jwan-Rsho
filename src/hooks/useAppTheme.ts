import { useColorScheme } from "react-native";

import { useAppStore } from "@/src/store/appStore";

export function useAppTheme() {
  const systemTheme = useColorScheme();
  const themeMode = useAppStore((state) => state.themeMode);

  if (themeMode === "system") {
    return systemTheme ?? "light";
  }

  return themeMode;
}

import { darkColors, lightColors } from "@/src/theme/colors";
import { useAppTheme } from "@/src/hooks/useAppTheme";

export function useThemeColors() {
  const theme = useAppTheme();
  return theme === "dark" ? darkColors : lightColors;
}

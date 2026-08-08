import { darkColors, lightColors } from "@/src/constants/colors";
import { useAppTheme } from "@/src/hooks/useAppTheme";

export function useThemeColors() {
  const theme = useAppTheme();
  return theme === "dark" ? darkColors : lightColors;
}

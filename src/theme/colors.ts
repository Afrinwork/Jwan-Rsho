const lightThemeColors = {
  primary: "#155EEF",
  primaryStrong: "#0B4FCC",
  primaryMuted: "#EEF4FF",
  secondary: "#0F766E",
  secondaryMuted: "#E8FFFB",
  background: "#FFFFFF",
  backgroundAccent: "#F5F8FC",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceMuted: "#F8FAFC",
  text: "#101828",
  textSecondary: "#344054",
  textMuted: "#667085",
  textOnPrimary: "#FFFFFF",
  border: "#D0D5DD",
  borderStrong: "#BFC8D5",
  success: "#067647",
  successBackground: "#ECFDF3",
  successBorder: "#ABEFC6",
  warning: "#B54708",
  warningBackground: "#FFFAEB",
  warningBorder: "#FEDF89",
  danger: "#B42318",
  dangerBackground: "#FEF3F2",
  dangerBorder: "#FECDCA",
  overlay: "rgba(16, 24, 40, 0.18)",
  shadow: "rgba(16, 24, 40, 0.1)",
};

const darkThemeColors = {
  primary: "#84ADFF",
  primaryStrong: "#A7C4FF",
  primaryMuted: "#12264A",
  secondary: "#6FE5D8",
  secondaryMuted: "#112E32",
  background: "#08111F",
  backgroundAccent: "#0F1D33",
  surface: "#0F1A2E",
  surfaceElevated: "#13213A",
  surfaceMuted: "#10203A",
  text: "#F8FAFC",
  textSecondary: "#D0D8E5",
  textMuted: "#98A7BC",
  textOnPrimary: "#08111F",
  border: "#20314A",
  borderStrong: "#314868",
  success: "#6CE9A6",
  successBackground: "#113122",
  successBorder: "#1E5A3A",
  warning: "#FEC84B",
  warningBackground: "#3A2A10",
  warningBorder: "#694A14",
  danger: "#FDA29B",
  dangerBackground: "#3B1618",
  dangerBorder: "#6D2D31",
  overlay: "rgba(1, 6, 16, 0.5)",
  shadow: "rgba(0, 0, 0, 0.35)",
};

export const lightColors = {
  ...lightThemeColors,
  mutedText: lightThemeColors.textMuted,
  primaryContrast: lightThemeColors.textOnPrimary,
};

export const darkColors = {
  ...darkThemeColors,
  mutedText: darkThemeColors.textMuted,
  primaryContrast: darkThemeColors.textOnPrimary,
};

export const colors = lightColors;
export type AppThemeColors = typeof lightColors;

const lightThemeColors = {
  primary: "#111111",
  primaryStrong: "#000000",
  primaryMuted: "#F3F3F3",
  secondary: "#1F1F1F",
  secondaryMuted: "#F5F5F5",
  background: "#FFFFFF",
  backgroundAccent: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceMuted: "#F7F7F7",
  text: "#111111",
  textSecondary: "#303030",
  textMuted: "#666666",
  textOnPrimary: "#FFFFFF",
  border: "#E5E5E5",
  borderStrong: "#CFCFCF",
  success: "#067647",
  successBackground: "#ECFDF3",
  successBorder: "#ABEFC6",
  warning: "#B54708",
  warningBackground: "#FFFAEB",
  warningBorder: "#FEDF89",
  danger: "#B42318",
  dangerBackground: "#FEF3F2",
  dangerBorder: "#FECDCA",
  overlay: "rgba(17, 17, 17, 0.1)",
  shadow: "rgba(17, 17, 17, 0.1)",
};

const darkThemeColors = {
  primary: "#E1A17A",
  primaryStrong: "#F2C4A8",
  primaryMuted: "#3B2418",
  secondary: "#7AD2C7",
  secondaryMuted: "#183633",
  background: "#17110D",
  backgroundAccent: "#241A14",
  surface: "#211813",
  surfaceElevated: "#2A1F19",
  surfaceMuted: "#34271F",
  text: "#F8F0E8",
  textSecondary: "#D8C3B3",
  textMuted: "#AE9584",
  textOnPrimary: "#17110D",
  border: "#46342A",
  borderStrong: "#6B5143",
  success: "#71D7A1",
  successBackground: "#183021",
  successBorder: "#27553A",
  warning: "#F1C27D",
  warningBackground: "#3A2916",
  warningBorder: "#775426",
  danger: "#F2A097",
  dangerBackground: "#3B1C1C",
  dangerBorder: "#75403C",
  overlay: "rgba(6, 3, 2, 0.45)",
  shadow: "rgba(0, 0, 0, 0.38)",
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

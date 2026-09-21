import { TextStyle } from "react-native";

export const fontFamilies = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  serif: "Lora_600SemiBold",
} as const;

export const typography = {
  display: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: 0,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0,
  },
  heading: {
    fontFamily: fontFamilies.semibold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0,
  },
  subheading: {
    fontFamily: fontFamilies.medium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 25,
  },
  bodyMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: 16,
    lineHeight: 25,
  },
  label: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

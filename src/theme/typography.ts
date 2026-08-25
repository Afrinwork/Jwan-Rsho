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
    fontFamily: fontFamilies.serif,
    fontSize: 42,
    lineHeight: 50,
    letterSpacing: -0.9,
  },
  title: {
    fontFamily: fontFamilies.serif,
    fontSize: 31,
    lineHeight: 39,
    letterSpacing: -0.45,
  },
  heading: {
    fontFamily: fontFamilies.semibold,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.35,
  },
  subheading: {
    fontFamily: fontFamilies.medium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.15,
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
    letterSpacing: 0.35,
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

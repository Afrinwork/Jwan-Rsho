import { TextStyle } from "react-native";

export const fontFamilies = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export const typography = {
  display: {
    fontFamily: fontFamilies.bold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.8,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: fontFamilies.semibold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  subheading: {
    fontFamily: fontFamilies.medium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

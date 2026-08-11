import { i18next } from "@/src/i18n/i18n";

export function formatDate(value: string) {
  const language = i18next.language === "ar" ? "ar-u-nu-latn" : i18next.language;
  return new Date(value).toLocaleDateString(language);
}

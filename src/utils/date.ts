import { i18next } from "@/src/i18n/i18n";

export function formatDate(value: string) {
  const date = new Date(value);
  // toLocaleDateString throws a RangeError for an Invalid Date instead of
  // returning a string -- a malformed/empty stored date must not crash
  // whatever screen renders it.
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  const language = i18next.language === "ar" ? "ar-u-nu-latn" : i18next.language;
  return date.toLocaleDateString(language);
}

export function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  const language = i18next.language === "ar" ? "ar-u-nu-latn" : i18next.language;
  return date.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" });
}

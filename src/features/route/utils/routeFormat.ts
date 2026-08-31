import { i18next } from "@/src/i18n/i18n";

// "ar-u-nu-latn" keeps Latin digits under the Arabic locale — plain "ar"
// renders Arabic-Indic numerals, which looks broken next to the rest of the
// app's Latin-digit UI (see src/utils/date.ts for the same convention).
function numberLocale() {
  return i18next.language === "ar" ? "ar-u-nu-latn" : i18next.language;
}

// Every customer/route in this app is in Germany — departure and arrival
// times must always read as German wall-clock time, regardless of the
// device's own system timezone (a device set to a different zone, or a
// simulator with a spoofed location, must not shift the times shown).
const ROUTE_TIME_ZONE = "Europe/Berlin";

export function formatEtaTime(date: Date) {
  // Always German 24h format ("14:05", never "2:05 PM"/"٢:٠٥ م") regardless
  // of the app's Arabic UI locale — times must stay unambiguous for drivers.
  return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ROUTE_TIME_ZONE });
}

export function formatHourMinute(hours: number, minutes: number) {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatDistanceKm(distanceKm: number) {
  return distanceKm.toLocaleString(numberLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// Date has no "construct at this wall-clock time in timezone X" API, so this
// reads `date`'s wall-clock parts as they'd appear in Europe/Berlin. Used to
// go the other way too (see buildEuropeBerlinDate): the difference between
// treating those parts as UTC and the real instant is exactly Berlin's UTC
// offset at that moment, DST included, with no manual offset table needed.
function getEuropeBerlinParts(date: Date) {
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat("en-US", {
    timeZone: ROUTE_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(date)
    .forEach((part) => {
      if (part.type !== "literal") parts[part.type] = part.value;
    });

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

// Builds the instant for `hours:minutes` on referenceDate's Europe/Berlin
// calendar day — the inverse of getEuropeBerlinParts above.
function buildEuropeBerlinDate(referenceDate: Date, hours: number, minutes: number): Date {
  const berlin = getEuropeBerlinParts(referenceDate);
  const berlinPartsAsUtcMs = Date.UTC(berlin.year, berlin.month - 1, berlin.day, berlin.hour, berlin.minute, berlin.second);
  const berlinOffsetMinutes = (berlinPartsAsUtcMs - referenceDate.getTime()) / 60_000;
  const targetPartsAsUtcMs = Date.UTC(berlin.year, berlin.month - 1, berlin.day, hours, minutes, 0, 0);
  return new Date(targetPartsAsUtcMs - berlinOffsetMinutes * 60_000);
}

export function parseTimeInput(value: string, referenceDate: Date = new Date()): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }

  // The typed value is always meant as German time (see ROUTE_TIME_ZONE) —
  // not the device's own local hours/minutes, which setHours() would use.
  return buildEuropeBerlinDate(referenceDate, hours, minutes);
}

import { i18next } from "@/src/i18n/i18n";
import { buildEuropeBerlinDate } from "@/src/utils/time/europeBerlin";

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
  // toLocaleTimeString throws a RangeError for an Invalid Date (e.g. an ETA
  // chain poisoned by one NaN leg upstream) -- an uncaught throw here during
  // render would crash the whole screen instead of just showing a blank time.
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  // Always German 24h format ("14:05", never "2:05 PM"/"٢:٠٥ م") regardless
  // of the app's Arabic UI locale — times must stay unambiguous for drivers.
  return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ROUTE_TIME_ZONE });
}

export function formatHourMinute(hours: number, minutes: number) {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// Duration display ("2:13" for 2h13m, "0:45" for 45min) — unlike
// formatHourMinute above (a clock time, so the hour is always 2 digits),
// a duration's hour part is left unpadded since it isn't a 0-23 clock value.
export function formatDurationHM(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

export function formatDistanceKm(distanceKm: number) {
  if (!Number.isFinite(distanceKm)) {
    return "--";
  }

  return distanceKm.toLocaleString(numberLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
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

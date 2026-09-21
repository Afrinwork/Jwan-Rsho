// Deno mirror of functions/src/shared/europeBerlin.ts (and
// src/utils/time/europeBerlin.ts) -- only what the cleanup job needs.
// DST-safe via Intl.DateTimeFormat with an explicit IANA timeZone.

export function getBerlinDateKeyDaysAgo(daysAgo: number): string {
  const target = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(target);

  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${year}-${month}-${day}`;
}

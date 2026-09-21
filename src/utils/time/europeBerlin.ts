const BERLIN_TIME_ZONE = "Europe/Berlin";
const MORNING_WINDOW_START_MINUTES = 6 * 60;
const MORNING_WINDOW_END_MINUTES = 10 * 60;

// Date has no "construct at this wall-clock time in timezone X" API, so this
// reads `date`'s wall-clock parts as they'd appear in Europe/Berlin. Used to
// go the other way too (see buildEuropeBerlinDate): the difference between
// treating those parts as UTC and the real instant is exactly Berlin's UTC
// offset at that moment, DST included, with no manual offset table needed.
export function getEuropeBerlinParts(date: Date) {
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat("en-US", {
    timeZone: BERLIN_TIME_ZONE,
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
export function buildEuropeBerlinDate(referenceDate: Date, hours: number, minutes: number): Date {
  const berlin = getEuropeBerlinParts(referenceDate);
  const berlinPartsAsUtcMs = Date.UTC(berlin.year, berlin.month - 1, berlin.day, berlin.hour, berlin.minute, berlin.second);
  const berlinOffsetMinutes = (berlinPartsAsUtcMs - referenceDate.getTime()) / 60_000;
  const targetPartsAsUtcMs = Date.UTC(berlin.year, berlin.month - 1, berlin.day, hours, minutes, 0, 0);
  return new Date(targetPartsAsUtcMs - berlinOffsetMinutes * 60_000);
}

// Berlin calendar-day key (e.g. "2026-09-15") for an instant — used as the
// driver check-in doc's `date` field and as the day boundary for the 3-day
// retention cleanup.
export function getBerlinDateKey(date: Date): string {
  const { year, month, day } = getEuropeBerlinParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function berlinMinutesOfDay(date: Date): number {
  const { hour, minute } = getEuropeBerlinParts(date);
  return hour * 60 + minute;
}

// The Morgen-Check window: 06:00 (inclusive) to 10:00 (exclusive) Berlin time.
export function isWithinMorningWindow(date: Date): boolean {
  const minutes = berlinMinutesOfDay(date);
  return minutes >= MORNING_WINDOW_START_MINUTES && minutes < MORNING_WINDOW_END_MINUTES;
}

// True from 10:00 Berlin time onward — the driver rule's block condition.
export function isPastMorningWindow(date: Date): boolean {
  return berlinMinutesOfDay(date) >= MORNING_WINDOW_END_MINUTES;
}

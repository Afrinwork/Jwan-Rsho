// Server-side mirror of getBerlinDateKey() in src/utils/time/europeBerlin.ts.
// functions/ is a fully isolated TS project (its own tsconfig baseUrl/
// include) and cannot import from the app's src/ — kept minimal, only what
// the cleanup job needs, not a full port of the client utility. Keep both
// copies in sync by hand.
export function getBerlinDateKey(date: Date): string {
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(date)
    .forEach((part) => {
      if (part.type !== "literal") parts[part.type] = part.value;
    });

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getBerlinDateKeyDaysAgo(daysAgo: number): string {
  const reference = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return getBerlinDateKey(reference);
}

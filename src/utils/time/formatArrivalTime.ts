// Always German 24h format ("14:05", never "2:05 PM"/"٢:٠٥ م") regardless of
// the app's Arabic UI — same convention as formatEtaTime in
// features/route/utils/routeFormat.ts: times must stay unambiguous for
// drivers. Unlike that one, the timezone is passed in explicitly (per
// destination country) instead of being fixed to Europe/Berlin.
export function formatArrivalTime(date: Date, timeZone: string): string {
  // toLocaleTimeString throws a RangeError for an Invalid Date instead of
  // returning a string -- guard so a bad upstream ETA can't crash the screen.
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone });
}

// Day boundaries in the device's own local timezone (not UTC, not a fixed
// zone like Europe/Berlin) — Date's local getters/constructor already read
// and write in whatever timezone the JS runtime is configured for, which on
// a phone is the user's actual local timezone. Comparing the resulting
// toISOString() strings lexicographically against stored completedAt values
// is safe: both are fixed-format ISO-8601 UTC instants.
export function getLocalDayIsoRange(reference: Date = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  return { startIso: start.toISOString(), endIsoExclusive: end.toISOString() };
}

export function isSameLocalDay(isoTimestamp: string, reference: Date = new Date()) {
  const value = new Date(isoTimestamp);
  return (
    value.getFullYear() === reference.getFullYear() &&
    value.getMonth() === reference.getMonth() &&
    value.getDate() === reference.getDate()
  );
}

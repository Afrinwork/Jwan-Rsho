// Within this distance of the current stop the driver is asked "arrived?".
export const ARRIVAL_THRESHOLD_KM = 0.12;
// …and the question only goes away again past this distance: GPS jitter
// around a single threshold (at a traffic light, in a jam) kept opening and
// closing the question's Modal, which froze the screen on Android.
export const ARRIVAL_LEAVE_KM = 0.25;

// The stop the driver is at (null = none) after a new position/current stop.
export function nextArrivedStopId(arrivedId: string | null, currentId: string | null, distanceToCurrentKm: number | null) {
  if (!currentId || distanceToCurrentKm === null) return null;
  if (arrivedId === currentId) return distanceToCurrentKm > ARRIVAL_LEAVE_KM ? null : arrivedId;
  return distanceToCurrentKm <= ARRIVAL_THRESHOLD_KM ? currentId : null;
}

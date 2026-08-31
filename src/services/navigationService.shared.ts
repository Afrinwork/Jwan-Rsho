export type NavigationTarget = {
  latitude?: number;
  longitude?: number;
  address?: string;
};

export type NavigationWaypoint = {
  latitude: number;
  longitude: number;
};

// Both Google Maps' app URL scheme and the classic web Directions UI only
// support a limited waypoint chain — beyond this, stops are silently
// dropped, so we cap the list rather than send a URL Google will reject.
const MAX_MULTI_STOP_WAYPOINTS = 9;

function toLatLngParam(point: NavigationWaypoint) {
  return `${point.latitude},${point.longitude}`;
}

export function buildAppleMapsUrl(target: NavigationTarget) {
  return `http://maps.apple.com/?daddr=${resolveDestination(target)}`;
}

export function buildGoogleMapsUrl(target: NavigationTarget) {
  return `comgooglemaps://?daddr=${resolveDestination(target)}&directionsmode=driving`;
}

export function buildWazeUrl(target: NavigationTarget) {
  if (target.address?.trim()) {
    return `waze://?q=${encodeURIComponent(target.address.trim())}&navigate=yes`;
  }

  return `waze://?ll=${target.latitude},${target.longitude}&navigate=yes`;
}

// Android's universal map intent — opens the system chooser for whichever
// maps app the user has, so it works even when neither Google Maps nor Waze
// is installed. Has no iOS equivalent (Apple Maps fills that role there).
export function buildGeoUrl(target: NavigationTarget) {
  if (target.address?.trim()) {
    return `geo:0,0?q=${encodeURIComponent(target.address.trim())}`;
  }

  return `geo:${target.latitude},${target.longitude}?q=${target.latitude},${target.longitude}`;
}

function resolveDestination(target: NavigationTarget) {
  if (target.address?.trim()) {
    return encodeURIComponent(target.address.trim());
  }

  return `${target.latitude},${target.longitude}`;
}

// Google Maps' iOS/Android app scheme accepts a chain of stops in daddr via
// "+to:" — this drives turn-by-turn through every stop in order, same as
// typing several addresses into Google Maps yourself.
export function buildGoogleMapsMultiStopAppUrl(origin: NavigationWaypoint, waypoints: NavigationWaypoint[]) {
  const stops = waypoints.slice(0, MAX_MULTI_STOP_WAYPOINTS);
  return `comgooglemaps://?saddr=${toLatLngParam(origin)}&daddr=${stops.map(toLatLngParam).join("+to:")}&directionsmode=driving`;
}

// Universal web link fallback (opens the Google Maps app if installed, else
// the browser) — dir_action=navigate starts driving navigation immediately
// instead of just showing the route preview.
export function buildGoogleMapsMultiStopWebUrl(origin: NavigationWaypoint, waypoints: NavigationWaypoint[]) {
  const stops = waypoints.slice(0, MAX_MULTI_STOP_WAYPOINTS);
  const destination = stops.at(-1)!;
  const intermediateStops = stops.slice(0, -1);

  const params = new URLSearchParams({
    api: "1",
    origin: toLatLngParam(origin),
    destination: toLatLngParam(destination),
    travelmode: "driving",
    dir_action: "navigate",
  });

  if (intermediateStops.length) {
    params.set("waypoints", intermediateStops.map(toLatLngParam).join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

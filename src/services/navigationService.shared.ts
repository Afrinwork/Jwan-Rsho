export type NavigationTarget = {
  latitude?: number;
  longitude?: number;
  address?: string;
};

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

function resolveDestination(target: NavigationTarget) {
  if (target.address?.trim()) {
    return encodeURIComponent(target.address.trim());
  }

  return `${target.latitude},${target.longitude}`;
}

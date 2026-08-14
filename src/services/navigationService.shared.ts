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

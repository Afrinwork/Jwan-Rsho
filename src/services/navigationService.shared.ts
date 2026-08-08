type Coordinate = {
  latitude: number;
  longitude: number;
};

export function buildAppleMapsUrl({ latitude, longitude }: Coordinate) {
  return `http://maps.apple.com/?daddr=${latitude},${longitude}`;
}

export function buildGoogleMapsUrl({ latitude, longitude }: Coordinate) {
  return `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
}

export function buildWazeUrl({ latitude, longitude }: Coordinate) {
  return `waze://?ll=${latitude},${longitude}&navigate=yes`;
}

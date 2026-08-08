type Point = {
  latitude: number;
  longitude: number;
};

type Circle = Point & {
  radiusKm: number;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export const mapSelectionService = {
  isPointInsideCircle(point: Point, circle: Circle) {
    const earthRadiusKm = 6371;
    const latDistance = toRadians(circle.latitude - point.latitude);
    const lngDistance = toRadians(circle.longitude - point.longitude);
    const a =
      Math.sin(latDistance / 2) ** 2 +
      Math.cos(toRadians(point.latitude)) *
        Math.cos(toRadians(circle.latitude)) *
        Math.sin(lngDistance / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= circle.radiusKm;
  },
};

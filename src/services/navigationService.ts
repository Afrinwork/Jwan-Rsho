import * as Linking from "expo-linking";

type Coordinate = {
  latitude: number;
  longitude: number;
};

function buildUrl(url: string) {
  return Linking.canOpenURL(url).then((supported) => {
    if (!supported) {
      throw new Error("Navigation app is not available.");
    }

    return Linking.openURL(url);
  });
}

export const navigationService = {
  openAppleMaps({ latitude, longitude }: Coordinate) {
    return buildUrl(`http://maps.apple.com/?daddr=${latitude},${longitude}`);
  },

  openGoogleMaps({ latitude, longitude }: Coordinate) {
    return buildUrl(`comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`);
  },

  openWaze({ latitude, longitude }: Coordinate) {
    return buildUrl(`waze://?ll=${latitude},${longitude}&navigate=yes`);
  },
};

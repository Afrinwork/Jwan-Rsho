import * as Location from "expo-location";

type AddressInput = {
  address: string;
  city: string;
  country: string;
  region?: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

export const geocodingService = {
  composeAddress(input: AddressInput) {
    return [input.address.trim(), input.city.trim(), input.region?.trim(), input.country.trim()]
      .filter(Boolean)
      .join(", ");
  },

  async geocodeAddress(address: string): Promise<Coordinates | null> {
    const [result] = await Location.geocodeAsync(address);
    return result
      ? { latitude: result.latitude, longitude: result.longitude }
      : null;
  },

  async geocodeCustomerAddress(input: AddressInput) {
    return this.geocodeAddress(this.composeAddress(input));
  },

  async geocodeCustomerAddressSafely(input: AddressInput) {
    try {
      return await this.geocodeCustomerAddress(input);
    } catch {
      return null;
    }
  },
};

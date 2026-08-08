type ShareCustomerLocationInput = {
  fullName: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
};

export function buildCustomerLocationMessage(input: ShareCustomerLocationInput) {
  return [
    input.fullName,
    input.address,
    input.phone,
    `Koordinaten: ${input.latitude}, ${input.longitude}`,
    `https://maps.apple.com/?ll=${input.latitude},${input.longitude}`,
  ]
    .filter(Boolean)
    .join("\n");
}

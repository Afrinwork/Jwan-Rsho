// Where a driver was last seen, independent of the daily status report:
// "trip" while driving a started trip, "app" when the app/map was open.
export type DriverLiveLocationSource = "trip" | "app";

export type DriverLiveLocation = {
  driverId: string;
  latitude: number;
  longitude: number;
  source: DriverLiveLocationSource;
  updatedAt: string;
  // The customer the driver completed last, and when.
  lastCustomerName: string | null;
  lastCustomerAt: string | null;
};

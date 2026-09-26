// A driver's trip in progress (RouteLiveScreen) — the stops in the order
// they're being driven and the one that's next. Shown to their admin live.
export type ActiveTrip = {
  customerIds: string[];
  currentCustomerId: string | null;
  updatedAt: string;
};

// A person's own saved stop order ("their list") — one per user, driver or
// admin/super_admin alike. Written by the user themselves or by the
// admin/super_admin who manages them (DriverLiveMapScreen), and read live
// by both, so a re-sort on either side shows up on the other right away.
export type RouteOrder = {
  userId: string;
  customerIds: string[];
  updatedBy: string;
  updatedAt: string;
  trip?: ActiveTrip | null;
};

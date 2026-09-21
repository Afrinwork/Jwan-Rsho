import { TimestampValue } from "@/src/types/common";

// "ok": valid coordinates on file. "failed": geocoding was attempted (at
// customer creation or edit) and did not resolve — the customer is still
// saved and still shows an open order, just needs its address reviewed.
// "pending" is reserved for a customer whose address hasn't been geocoded
// yet at all (e.g. a future background-retry queue); the app doesn't
// currently produce it, but the map's "needs address check" bucket treats it
// the same as "failed". Absent (legacy docs from before this field existed)
// is treated as "ok" if coordinates are present, "failed" otherwise — see
// hasValidCoordinates() in mapCustomerService.ts, which never trusts this
// field alone.
export type CustomerLocationStatus = "ok" | "pending" | "failed";

export type Customer = {
  id: string;
  ownerId: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  normalizedCity: string;
  country: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  locationStatus?: CustomerLocationStatus;
  note?: string;
  assignedDriverId?: string;
  isActive: boolean;
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
};

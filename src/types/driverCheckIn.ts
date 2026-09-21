export type DriverCheckInStatus = "pending" | "ok" | "blocked";

export type DriverCheckInBlockReason = "max_attempts" | "no_response_by_10" | "admin_blocked";

export type DriverCheckIn = {
  id: string; // `${driverId}_${date}`
  ownerId: string;
  driverId: string;
  date: string; // Berlin calendar day, YYYY-MM-DD — see getBerlinDateKey
  status: DriverCheckInStatus;
  blockedReason?: DriverCheckInBlockReason;
  attempts: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  odometerKm?: number;
  photoStoragePath?: string; // Storage object path, not a download URL
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

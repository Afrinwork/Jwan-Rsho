import { TimestampValue } from "@/src/types/common";

export type Customer = {
  id: string;
  ownerId: string;
  fullName: string;
  phone: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  normalizedCity: string;
  country: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  note?: string;
  isActive: boolean;
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
};

import { TimestampValue } from "@/src/types/common";

export type Region = {
  id: string;
  ownerId: string;
  name: string;
  normalizedName: string;
  country: string;
  normalizedCountry: string;
  city?: string;
  normalizedCity?: string;
  isActive: boolean;
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
};

import { TimestampValue } from "@/src/types/common";

export type City = {
  id: string;
  ownerId: string;
  name: string;
  nameAr?: string;
  normalizedName: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
};

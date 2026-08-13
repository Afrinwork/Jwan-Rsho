import { TimestampValue } from "@/src/types/common";

export type Country = {
  id: string;
  ownerId: string;
  name: string;
  nameAr?: string;
  normalizedName: string;
  isoCode?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
};

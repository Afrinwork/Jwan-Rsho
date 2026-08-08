import { TimestampValue } from "@/src/types/common";

export type Country = {
  id: string;
  ownerId: string;
  name: string;
  normalizedName: string;
  isoCode?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
};

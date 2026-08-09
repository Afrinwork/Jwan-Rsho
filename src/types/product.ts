import { TimestampValue } from "@/src/types/common";

export type Product = {
  id: string;
  ownerId: string;
  name: string;
  normalizedName: string;
  defaultUnit: string;
  emoji?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
};

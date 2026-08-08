import { z } from "zod";

export const regionSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  name: z.string().trim().min(1, "Region erforderlich"),
  normalizedName: z.string().optional(),
  country: z.string().trim().min(1, "Land erforderlich"),
  normalizedCountry: z.string().optional(),
  city: z.string().trim().optional(),
  normalizedCity: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

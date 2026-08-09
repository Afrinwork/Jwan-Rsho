import { z } from "zod";

export const customerSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  fullName: z.string().trim().min(1, "Name erforderlich"),
  phone: z.string().trim().min(1, "Telefonnummer erforderlich"),
  address: z.string().trim().min(1, "Adresse erforderlich"),
  city: z.string().trim().min(1, "Stadt erforderlich"),
  normalizedCity: z.string().optional(),
  country: z.string().trim().min(1, "Land erforderlich"),
  region: z.string().trim().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  note: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

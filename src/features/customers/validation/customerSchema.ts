import { z } from "zod";

export const customerSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  fullName: z.string().trim().min(1, "Name required"),
  phone: z.string().trim().min(1, "Phone required"),
  street: z.string().trim().min(1, "Street required"),
  houseNumber: z.string().trim().min(1, "House number required"),
  postalCode: z.string().trim().min(1, "Postal code required"),
  city: z.string().trim().min(1, "City required"),
  normalizedCity: z.string().optional(),
  country: z.string().trim().min(1, "Country required"),
  region: z.string().trim().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  note: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

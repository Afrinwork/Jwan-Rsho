import { z } from "zod";

import { emailSchema } from "@/src/validation/commonSchemas";

export const createUserSchema = z
  .object({
    fullName: z.string().trim().min(1, "Name erforderlich"),
    email: emailSchema,
    password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
    confirmPassword: z.string().min(1, "Bitte Passwort wiederholen"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwoerter muessen gleich sein",
    path: ["confirmPassword"],
  });

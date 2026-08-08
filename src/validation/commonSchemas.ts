import { z } from "zod";

export const emailSchema = z.email("Bitte eine gueltige E-Mail-Adresse eingeben");
export const passwordSchema = z.string().min(6, "Passwort ist erforderlich");

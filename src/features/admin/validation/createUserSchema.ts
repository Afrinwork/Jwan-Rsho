import { z } from "zod";

import { t } from "@/src/i18n/i18n";
import { emailSchema } from "@/src/validation/commonSchemas";

export const createUserSchema = z
  .object({
    fullName: z.string().trim().min(1, t("admin:validation.nameRequired")),
    email: emailSchema,
    password: z.string().min(8, t("admin:validation.passwordTooShort")),
    confirmPassword: z.string().min(1, t("admin:validation.confirmPasswordRequired")),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: t("admin:validation.passwordsMustMatch"),
    path: ["confirmPassword"],
  });

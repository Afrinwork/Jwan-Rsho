import { z } from "zod";

import { emailSchema, passwordSchema } from "@/src/validation/commonSchemas";

export const createUserSchema = z.object({
  fullName: z.string().min(2),
  email: emailSchema,
  password: passwordSchema,
});

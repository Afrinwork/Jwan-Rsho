import { z } from "zod";

import { emailSchema, passwordSchema } from "@/src/validation/commonSchemas";

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

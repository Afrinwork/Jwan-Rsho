import { z } from "zod";
import { emailSchema } from "@/src/validation/commonSchemas";

export const deleteUserSchema = z.object({
  email: emailSchema,
});

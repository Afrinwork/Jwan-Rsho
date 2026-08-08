import { z } from "zod";

export const deleteUserSchema = z.object({
  identifier: z.string().min(3),
});

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authService } from "@/src/features/auth/services/authService";
import { formatError } from "@/src/utils/formatError";
import { emailSchema } from "@/src/validation/commonSchemas";

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function useForgotPassword() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const submit = form.handleSubmit(async ({ email }) => {
    try {
      setError(null);
      await authService.resetPassword(email);
      setMessage("Reset email sent.");
    } catch (value) {
      setError(formatError(value).message);
      setMessage(null);
    }
  });

  return { form, submit, message, error };
}

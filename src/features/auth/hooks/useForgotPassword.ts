import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { authService } from "@/src/features/auth/services/authService";
import { formatError } from "@/src/utils/formatError";
import { emailSchema } from "@/src/validation/commonSchemas";

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function useForgotPassword() {
  const { t } = useTranslation("auth");
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
      setMessage(t("forgotPassword.successMessage"));
    } catch (value) {
      setError(formatError(value).message);
      setMessage(null);
    }
  });

  return { form, submit, message, error };
}

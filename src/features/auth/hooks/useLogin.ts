import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { authService } from "@/src/features/auth/services/authService";
import { LoginFormValues } from "@/src/features/auth/types/authTypes";
import { loginSchema } from "@/src/features/auth/validation/loginSchema";
import { formatError } from "@/src/utils/formatError";

export function useLogin() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await authService.login(values.email, values.password);
    } catch (error) {
      setSubmitError(formatError(error).message);
    }
  });

  return { form, submit, submitError };
}

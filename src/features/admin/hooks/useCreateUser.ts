import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { adminService } from "@/src/features/admin/services/adminService";
import { CreateUserFormValues } from "@/src/features/admin/types/adminFormTypes";
import { createUserSchema } from "@/src/features/admin/validation/createUserSchema";
import { formatError } from "@/src/utils/formatError";

export function useCreateUser() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await adminService.createUser(values);
      form.reset();
      setSuccessMessage("User created successfully.");
    } catch (error) {
      setSubmitError(formatError(error).message);
      setSuccessMessage(null);
    }
  });

  return { form, submit, submitError, successMessage };
}

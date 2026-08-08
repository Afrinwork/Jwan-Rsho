import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { adminService } from "@/src/features/admin/services/adminService";
import { DeleteUserFormValues } from "@/src/features/admin/types/adminFormTypes";
import { deleteUserSchema } from "@/src/features/admin/validation/deleteUserSchema";
import { formatError } from "@/src/utils/formatError";

export function useDeleteUser() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<DeleteUserFormValues>({
    resolver: zodResolver(deleteUserSchema),
    defaultValues: { identifier: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await adminService.deleteUser(values.identifier);
      form.reset();
      setSuccessMessage("User deletion request sent.");
    } catch (error) {
      setSubmitError(formatError(error).message);
      setSuccessMessage(null);
    }
  });

  return { form, submit, submitError, successMessage };
}

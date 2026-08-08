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
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const form = useForm<DeleteUserFormValues>({
    resolver: zodResolver(deleteUserSchema),
    defaultValues: { email: "" },
  });

  const requestDelete = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setSuccessMessage(null);
    setPendingEmail(values.email);
  });

  async function confirmDelete() {
    const email = pendingEmail;

    if (!email) {
      return;
    }

    try {
      setSubmitError(null);
      await adminService.deleteUser(email);
      form.reset();
      setSuccessMessage("Benutzer wurde endgueltig geloescht.");
      setPendingEmail(null);
    } catch (error) {
      setSubmitError(formatError(error).message);
      setSuccessMessage(null);
    }
  }

  return {
    form,
    submitError,
    successMessage,
    pendingEmail,
    requestDelete,
    confirmDelete,
    cancelDelete: () => setPendingEmail(null),
  };
}

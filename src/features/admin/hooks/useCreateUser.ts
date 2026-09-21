import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { t } from "@/src/i18n/i18n";

import { canManageAdmins } from "@/src/features/auth/permissions";
import { adminService } from "@/src/features/admin/services/adminService";
import { CreateUserFormValues } from "@/src/features/admin/types/adminFormTypes";
import { createUserSchema } from "@/src/features/admin/validation/createUserSchema";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { formatError } from "@/src/utils/formatError";

export function useCreateUser() {
  const currentUser = useCurrentUser();
  const canCreateAdmins = canManageAdmins(currentUser);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", role: "driver" },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await adminService.createUser({
        email: values.email,
        fullName: values.fullName,
        password: values.password,
        // A plain admin can only ever create drivers — enforced again
        // server-side regardless, but keeping the client from even trying to
        // submit "admin" here avoids a pointless round trip.
        role: canCreateAdmins ? values.role : "driver",
      });
      form.reset();
      setSuccessMessage(t("admin:createUser.successMessage"));
    } catch (error) {
      setSubmitError(formatError(error).message);
      setSuccessMessage(null);
    }
  });

  return { canCreateAdmins, form, submit, submitError, successMessage };
}

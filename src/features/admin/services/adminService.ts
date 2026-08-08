import { httpsCallable } from "firebase/functions";

import { functionsClient } from "@/src/firebase/functions";
import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";

type CreateUserInput = {
  email: string;
  fullName: string;
  password: string;
};

export const adminService = {
  async createUser(input: CreateUserInput) {
    if (!functionsClient) {
      throw new AppError(errorMessages.firebaseNotConfigured);
    }

    const callable = httpsCallable<CreateUserInput, { success: boolean }>(
      functionsClient,
      "createUser",
    );
    return callable(input);
  },

  async deleteUser(email: string) {
    if (!functionsClient) {
      throw new AppError(errorMessages.firebaseNotConfigured);
    }

    const callable = httpsCallable<{ email: string }, { success: boolean }>(
      functionsClient,
      "deleteUser",
    );
    return callable({ email });
  },
};

import { httpsCallable } from "firebase/functions";

import { functionsClient } from "@/src/firebase/functions";
import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";

type CreateUserInput = {
  email: string;
  fullName: string;
  password: string;
  role: "admin" | "driver";
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

  async getActiveUserCount() {
    if (!functionsClient) {
      throw new AppError(errorMessages.firebaseNotConfigured);
    }

    const callable = httpsCallable<undefined, { count: number }>(
      functionsClient,
      "getActiveUserCount",
    );
    const result = await callable();
    return result.data.count;
  },

  async setUserActiveState(input: { email: string; isActive: boolean }) {
    if (!functionsClient) {
      throw new AppError(errorMessages.firebaseNotConfigured);
    }

    const callable = httpsCallable<{ email: string; isActive: boolean }, { success: boolean }>(
      functionsClient,
      "setUserActiveState",
    );
    return callable(input);
  },

  async updateManagedUser(input: { email: string; fullName?: string; newEmail?: string }) {
    if (!functionsClient) {
      throw new AppError(errorMessages.firebaseNotConfigured);
    }

    const callable = httpsCallable<{ email: string; fullName?: string; newEmail?: string }, { success: boolean }>(
      functionsClient,
      "updateManagedUser",
    );
    return callable(input);
  },
};

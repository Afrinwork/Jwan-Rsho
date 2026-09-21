import { httpsCallable } from "firebase/functions";

import { functionsClient } from "@/src/firebase/functions";
import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";

export const accountDeletionService = {
  async deleteOwnAccount() {
    if (!functionsClient) {
      throw new AppError(errorMessages.firebaseNotConfigured);
    }

    const callable = httpsCallable<undefined, { success: boolean }>(
      functionsClient,
      "deleteOwnAccount",
    );
    return callable();
  },
};

import { errorMessages } from "@/src/errors/errorMessages";

export class AppError extends Error {
  constructor(
    message = errorMessages.generic,
    public readonly code = "app/error",
  ) {
    super(message);
  }
}

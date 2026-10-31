import { z } from "zod";

import { t } from "@/src/i18n/i18n";

// Trimmed and lower-cased before the check: Android keyboards append a space
// after a suggested word and may capitalize the first letter, which made a
// correctly typed email fail validation or not match the account.
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email(t("validation:invalidEmail")));
export const passwordSchema = z.string().min(6, t("validation:passwordRequired"));

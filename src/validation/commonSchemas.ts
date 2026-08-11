import { z } from "zod";

import { t } from "@/src/i18n/i18n";

export const emailSchema = z.email(t("validation:invalidEmail"));
export const passwordSchema = z.string().min(6, t("validation:passwordRequired"));

import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useOrderCleanup } from "@/src/features/settings/hooks/useOrderCleanup";
import { useUserPreferences } from "@/src/features/settings/hooks/useUserPreferences";

export function SettingsBootstrap() {
  const user = useCurrentUser();

  useUserPreferences();
  useOrderCleanup();

  if (!user) {
    return null;
  }

  return null;
}

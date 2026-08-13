import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useUserPreferences } from "@/src/features/settings/hooks/useUserPreferences";

export function SettingsBootstrap() {
  const user = useCurrentUser();

  useUserPreferences();

  if (!user) {
    return null;
  }

  return null;
}

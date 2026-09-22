import { PropsWithChildren, useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useTranslation } from "react-i18next";

import { LoadingView } from "@/src/components/ui/LoadingView";
import { resolveAuthRedirect } from "@/src/components/layout/authGateRules";
import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

export function AuthGate({ children }: PropsWithChildren) {
  const { t } = useTranslation("common");
  const { authLoading, canAccessFullApp, isAuthenticated, isDriver } = useAuthSession();
  const router = useRouter();
  const segments = useSegments();

  // Computed during render (not in the effect below) so `children` can
  // never mount for even one frame while a redirect is pending -- e.g. a
  // device with a stale/missing session landing back on an app screen
  // instead of login. Rendering that screen's data hooks even briefly
  // throws (they require an authenticated user), which used to crash to
  // the error boundary instead of just showing the login screen a moment
  // later. The actual navigation still has to happen in an effect (React
  // doesn't allow navigating during render), but nothing that needs a
  // session gets a chance to run before it does.
  const redirectTo = authLoading
    ? null
    : resolveAuthRedirect({
        isAuthenticated,
        canAccessAdminArea: canAccessFullApp,
        firstSegment: segments[0],
        secondSegment: segments[1],
        isDriver,
      });

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  if (authLoading || redirectTo) {
    return <LoadingView label={t("checkingSession")} />;
  }

  return <>{children}</>;
}

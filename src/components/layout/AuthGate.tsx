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

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const redirectTo = resolveAuthRedirect({
      isAuthenticated,
      canAccessAdminArea: canAccessFullApp,
      firstSegment: segments[0],
      secondSegment: segments[1],
      isDriver,
    });

    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [authLoading, canAccessFullApp, isAuthenticated, isDriver, router, segments]);

  if (authLoading) {
    return <LoadingView label={t("checkingSession")} />;
  }

  return <>{children}</>;
}

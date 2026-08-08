import { PropsWithChildren, useEffect } from "react";
import { useRouter, useSegments } from "expo-router";

import { LoadingView } from "@/src/components/ui/LoadingView";
import { resolveAuthRedirect } from "@/src/components/layout/authGateRules";
import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

export function AuthGate({ children }: PropsWithChildren) {
  const { authLoading, isAdmin, isAuthenticated } = useAuthSession();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const redirectTo = resolveAuthRedirect({ isAuthenticated, isAdmin, firstSegment: segments[0] });

    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [authLoading, isAdmin, isAuthenticated, router, segments]);

  if (authLoading) {
    return <LoadingView label="Checking session..." />;
  }

  return <>{children}</>;
}

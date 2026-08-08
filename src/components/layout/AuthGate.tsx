import { PropsWithChildren, useEffect } from "react";
import { useRouter, useSegments } from "expo-router";

import { LoadingView } from "@/src/components/ui/LoadingView";
import { routes } from "@/src/constants/routes";
import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

export function AuthGate({ children }: PropsWithChildren) {
  const { authLoading, isAdmin, isAuthenticated } = useAuthSession();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === "(auth)";
    const inAdminArea = firstSegment === "admin";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace(routes.login);
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace(routes.cities);
      return;
    }

    if (inAdminArea && !isAdmin) {
      router.replace(routes.cities);
    }
  }, [authLoading, isAdmin, isAuthenticated, router, segments]);

  if (authLoading) {
    return <LoadingView label="Checking session..." />;
  }

  return <>{children}</>;
}

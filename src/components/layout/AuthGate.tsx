import { PropsWithChildren, useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { LoadingView } from "@/src/components/ui/LoadingView";
import { resolveAuthRedirect } from "@/src/components/layout/authGateRules";
import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

export function AuthGate({ children }: PropsWithChildren) {
  const { t } = useTranslation("common");
  const { authLoading, canAccessFullApp, isAuthenticated, isDriver } = useAuthSession();
  const router = useRouter();
  const segments = useSegments();

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

  // Only the very first session check holds the navigator back (authLoading
  // is true once, at startup). After that the navigator must NEVER be
  // unmounted for a redirect: router.replace() needs it mounted, and
  // unmounting it made it remount on the same route and redirect again,
  // forever ("Maximum update depth exceeded"). Screens that need a session
  // or a manager role are guarded with Stack/Tabs.Protected in the layouts
  // instead, so they can't render in the meantime; this just covers the
  // screen until the redirect lands.
  if (authLoading) {
    return <LoadingView label={t("checkingSession")} />;
  }

  return (
    <>
      {children}
      {redirectTo ? (
        <View style={StyleSheet.absoluteFill}>
          <LoadingView label={t("checkingSession")} />
        </View>
      ) : null}
    </>
  );
}

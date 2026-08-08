import { routes } from "@/src/constants/routes";

type ResolveAuthRedirectInput = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  firstSegment: string | undefined;
};

export function resolveAuthRedirect({
  isAuthenticated,
  isAdmin,
  firstSegment,
}: ResolveAuthRedirectInput): typeof routes.login | typeof routes.cities | null {
  const inAuthGroup = firstSegment === "(auth)";
  const inAdminArea = firstSegment === "admin";

  if (!isAuthenticated && !inAuthGroup) {
    return routes.login;
  }

  if (isAuthenticated && inAuthGroup) {
    return routes.cities;
  }

  if (inAdminArea && !isAdmin) {
    return routes.cities;
  }

  return null;
}

import { routes } from "@/src/constants/routes";

type ResolveAuthRedirectInput = {
  isAuthenticated: boolean;
  canAccessAdminArea: boolean;
  isDriver: boolean;
  firstSegment: string | undefined;
  secondSegment?: string | undefined;
};

export function resolveAuthRedirect({
  isAuthenticated,
  canAccessAdminArea,
  isDriver,
  firstSegment,
  secondSegment,
}: ResolveAuthRedirectInput): typeof routes.login | typeof routes.overview | typeof routes.map | null {
  const inAuthGroup = firstSegment === "(auth)";
  const inAdminArea = firstSegment === "admin";
  // Must match the tabs app/(tabs)/_layout.tsx shows a driver — a visible
  // tab that isn't listed here redirects on every tap.
  const isDriverTab =
    firstSegment === "(tabs)" && (secondSegment === "map" || secondSegment === "add" || secondSegment === "settings");
  const isDriverRoute = firstSegment === "map" || firstSegment === "customer" || firstSegment === "order";

  if (!isAuthenticated && !inAuthGroup) {
    return routes.login;
  }

  if (isAuthenticated && inAuthGroup) {
    return isDriver ? routes.map : routes.overview;
  }

  if (isDriver && !isDriverTab && !isDriverRoute) {
    return routes.map;
  }

  if (inAdminArea && !canAccessAdminArea) {
    return isDriver ? routes.map : routes.overview;
  }

  return null;
}

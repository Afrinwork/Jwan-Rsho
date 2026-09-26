import { Redirect } from "expo-router";

import { routes } from "@/src/constants/routes";
import { isDriver } from "@/src/features/auth/permissions";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";

// Same landing screen AuthGate would pick — a driver may not open the
// overview, so sending them there would only bounce off AuthGate again.
export default function IndexRoute() {
  const currentUser = useCurrentUser();
  return <Redirect href={isDriver(currentUser) ? routes.map : routes.overview} />;
}

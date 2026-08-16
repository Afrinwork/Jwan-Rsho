import { Redirect } from "expo-router";

import { routes } from "@/src/constants/routes";

export default function IndexRoute() {
  return <Redirect href={routes.overview} />;
}

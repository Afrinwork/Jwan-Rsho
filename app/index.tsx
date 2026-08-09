import { useEffect, useState } from "react";
import { Redirect } from "expo-router";

import { LoadingView } from "@/src/components/ui/LoadingView";
import { routes } from "@/src/constants/routes";
import { authRepository } from "@/src/repositories/authRepository";

export default function IndexRoute() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const resetSession = async () => {
      try {
        await authRepository.logout();
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    void resetSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return <LoadingView label="Anmeldung wird vorbereitet..." />;
  }

  return <Redirect href={routes.login} />;
}

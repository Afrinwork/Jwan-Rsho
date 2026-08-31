import { useState } from "react";

import { AppButton } from "@/src/components/ui/AppButton";
import { routeT } from "@/src/features/route/i18n/routeT";

type DeliveryNavigationControlsProps = {
  isNavigating: boolean;
  onStart: () => Promise<void>;
  onEnd: () => void;
};

// The "Route starten"/"Route beenden" button below the existing "als
// erledigt"/"überspringen" row — reuses the existing AppButton so it matches
// the app's button styling instead of a new design, and is full-width like
// its sibling buttons in this bottom sheet so it never overflows the screen.
export function DeliveryNavigationControls({ isNavigating, onStart, onEnd }: DeliveryNavigationControlsProps) {
  const t = routeT;
  const [isStarting, setIsStarting] = useState(false);

  async function handleStart() {
    setIsStarting(true);
    try {
      await onStart();
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <AppButton
      label={isNavigating ? t("live.endNavigation") : t("live.startNavigation")}
      loading={isStarting}
      onPress={() => void (isNavigating ? onEnd() : handleStart())}
      variant={isNavigating ? "danger" : "success"}
    />
  );
}

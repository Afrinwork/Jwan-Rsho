import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";

type CitySummaryHeaderProps = {
  cityCount: number;
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
};

export function CitySummaryHeader({ cityCount, title, subtitle, rightSlot }: CitySummaryHeaderProps) {
  const { t } = useTranslation("cities");

  return (
    <CompactScreenHeader
      rightSlot={rightSlot}
      subtitle={subtitle ?? t("summary.defaultSubtitle")}
      title={title ?? t("summary.defaultTitle")}
    />
  );
}

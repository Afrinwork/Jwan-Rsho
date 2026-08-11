import { useTranslation } from "react-i18next";

import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";

type CitySummaryHeaderProps = {
  cityCount: number;
  title?: string;
  subtitle?: string;
};

export function CitySummaryHeader({ cityCount, title, subtitle }: CitySummaryHeaderProps) {
  const { t } = useTranslation("cities");

  return (
    <CompactScreenHeader subtitle={subtitle ?? t("summary.defaultSubtitle")} title={title ?? t("summary.defaultTitle")} />
  );
}

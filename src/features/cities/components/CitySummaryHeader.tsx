import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";

type CitySummaryHeaderProps = {
  cityCount: number;
  title?: string;
  subtitle?: string;
};

export function CitySummaryHeader({ cityCount, title = "Staedte", subtitle }: CitySummaryHeaderProps) {
  return (
    <CompactScreenHeader subtitle={subtitle ?? "Aus deinen Kundendaten gruppiert."} title={title} />
  );
}

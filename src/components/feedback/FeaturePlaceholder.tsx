import { Text } from "react-native";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
};

export function FeaturePlaceholder({
  title,
  description,
}: FeaturePlaceholderProps) {
  return (
    <ScreenContainer>
      <Text accessibilityRole="header">{title}</Text>
      <EmptyState message={description} title="Base structure ready" />
    </ScreenContainer>
  );
}

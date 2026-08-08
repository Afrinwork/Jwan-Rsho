import { AppButton } from "@/src/components/ui/AppButton";

type SaveOrderButtonProps = {
  isSubmitting: boolean;
  onPress: () => void;
};

export function SaveOrderButton({ isSubmitting, onPress }: SaveOrderButtonProps) {
  return (
    <AppButton
      disabled={isSubmitting}
      label={isSubmitting ? "Speichert..." : "Bestellung speichern"}
      loading={isSubmitting}
      onPress={onPress}
    />
  );
}

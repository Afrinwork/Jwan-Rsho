import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";

type CityCustomerActionsProps = {
  selected: boolean;
  onToggleSelection: () => void;
  onPressDetails: () => void;
  canComplete: boolean;
  completing: boolean;
  onComplete: () => void;
};

export function CityCustomerActions(props: CityCustomerActionsProps) {
  const { t } = useTranslation("cities");

  return (
    <View style={styles.container}>
      <AppButton label={props.selected ? t("customerActions.deselect") : t("customerActions.select")} onPress={props.onToggleSelection} size="compact" variant="secondary" />
      <AppButton label={t("customerActions.details")} onPress={props.onPressDetails} size="compact" variant="secondary" />
      {props.canComplete ? (
        <AppButton disabled={props.completing} label={t("customerActions.complete")} loading={props.completing} onPress={props.onComplete} size="compact" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
});

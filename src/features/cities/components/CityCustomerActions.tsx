import { StyleSheet, View } from "react-native";

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
  return (
    <View style={styles.container}>
      <AppButton label={props.selected ? "Abwaehlen" : "Auswaehlen"} onPress={props.onToggleSelection} variant="secondary" />
      <AppButton label="Details" onPress={props.onPressDetails} variant="secondary" />
      {props.canComplete ? (
        <AppButton label="Erledigt" loading={props.completing} onPress={props.onComplete} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 8,
  },
});

import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { colors } from "@/src/constants/colors";

type CitySelectionBarProps = {
  selectedCount: number;
  onSelectAllOpen: () => void;
  onResetSelection: () => void;
};

export function CitySelectionBar(props: CitySelectionBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{props.selectedCount} Kunden ausgewaehlt</Text>
      <View style={styles.actions}>
        <AppButton label="Alle offenen" onPress={props.onSelectAllOpen} variant="secondary" />
        <AppButton label="Auswahl loeschen" onPress={props.onResetSelection} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { color: colors.text, fontSize: 14, fontWeight: "600" },
  actions: { gap: 10 },
});

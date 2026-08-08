import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/constants/colors";
import { spacing } from "@/src/constants/spacing";
import { formatAddress } from "@/src/utils/formatAddress";

import { CityCustomerActions } from "@/src/features/cities/components/CityCustomerActions";
import { CityCustomerItem } from "@/src/features/cities/types/cityCustomerTypes";

type CityCustomerCardProps = {
  customer: CityCustomerItem;
  selected: boolean;
  completing: boolean;
  onComplete: () => void;
  onToggleSelection: () => void;
  onPressDetails: () => void;
};

export function CityCustomerCard(props: CityCustomerCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{props.customer.fullName}</Text>
      <Text style={styles.meta}>{props.customer.phone}</Text>
      <Text style={styles.meta}>{formatAddress([`${props.customer.street} ${props.customer.houseNumber}`, props.customer.postalCode, props.customer.city])}</Text>
      <Text style={styles.meta}>{props.customer.currentOpenOrderLabel ?? "Keine offene Bestellung"}</Text>
      <Text style={styles.status}>{labelForStatus(props.customer.status)}</Text>
      <CityCustomerActions canComplete={Boolean(props.customer.currentOpenOrderId)} completing={props.completing} onComplete={props.onComplete} onPressDetails={props.onPressDetails} onToggleSelection={props.onToggleSelection} selected={props.selected} />
    </View>
  );
}

function labelForStatus(status: CityCustomerItem["status"]) {
  if (status === "open") {
    return "Status: offen";
  }

  if (status === "completed") {
    return "Status: erledigt";
  }

  return "Status: ohne offene Bestellung";
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: spacing.md, gap: 6 },
  name: { color: colors.text, fontSize: 18, fontWeight: "700" },
  meta: { color: colors.mutedText, fontSize: 14 },
  status: { color: colors.primary, fontSize: 14, fontWeight: "600" },
});

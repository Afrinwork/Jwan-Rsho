import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/constants/colors";
import { formatAddress } from "@/src/utils/formatAddress";

type CustomerDetailsHeaderProps = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
};

export function CustomerDetailsHeader(props: CustomerDetailsHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{props.fullName}</Text>
      <Text style={styles.meta}>{props.phone}</Text>
      <Text style={styles.meta}>{formatAddress([props.address, props.city])}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  title: { color: colors.text, fontSize: 24, fontWeight: "700" },
  meta: { color: colors.mutedText, fontSize: 14 },
});

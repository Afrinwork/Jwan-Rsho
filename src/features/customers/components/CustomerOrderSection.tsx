import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/constants/colors";
import { OrderWithItems } from "@/src/types/order";

import { CustomerOrderCard } from "@/src/features/customers/components/CustomerOrderCard";

type CustomerOrderSectionProps = {
  title: string;
  orders: OrderWithItems[];
};

export function CustomerOrderSection(props: CustomerOrderSectionProps) {
  if (!props.orders.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{props.title}</Text>
      {props.orders.map((value) => (
        <CustomerOrderCard key={value.id} order={value} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { color: colors.text, fontSize: 18, fontWeight: "700" },
});

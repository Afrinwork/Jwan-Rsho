import { PropsWithChildren } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

type AnimatedEntranceProps = PropsWithChildren<{
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}>;

// Kept as a layout wrapper so existing screens retain their structure without
// adding entrance motion to frequent operational workflows.
export function AnimatedEntrance({ children, style }: AnimatedEntranceProps) {
  return <View style={style}>{children}</View>;
}

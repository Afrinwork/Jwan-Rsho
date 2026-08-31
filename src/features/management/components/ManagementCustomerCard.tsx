import { ArrowRight20Regular, Person20Regular } from "@fluentui/react-native-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";
import { Customer } from "@/src/types/customer";
import { formatAddress } from "@/src/utils/formatAddress";

type ManagementCustomerCardProps = {
  customer: Customer;
  onPress: () => void;
};

export function ManagementCustomerCard(props: ManagementCustomerCardProps) {
  const colors = useThemeColors();

  return (
    <Pressable onPress={props.onPress} style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null]}>
      <AppCard
        contentStyle={styles.card}
        frosted
        style={[styles.frame, { backgroundColor: "#F8E0CF", borderColor: colors.primaryStrong, shadowColor: colors.primary }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.primaryStrong }]}>
          <Person20Regular color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <AppText numberOfLines={1} variant="subheading">
            {props.customer.fullName}
          </AppText>
          <AppText color="muted" numberOfLines={1} variant="caption">
            {props.customer.phone}
          </AppText>
          <AppText color="muted" numberOfLines={1} variant="caption">
            {formatAddress([props.customer.address, props.customer.city])}
          </AppText>
        </View>
        <View style={[styles.arrowWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <ArrowRight20Regular color={colors.primary} />
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.card,
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.993 }],
  },
  frame: {
    borderRadius: radius.xl,
    padding: 2,
    borderWidth: 1,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  arrowWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

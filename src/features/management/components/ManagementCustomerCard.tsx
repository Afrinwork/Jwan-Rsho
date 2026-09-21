import { ArrowRight20Regular, Delete20Regular } from "@fluentui/react-native-icons";
import { ActivityIndicator, I18nManager, Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { spacing } from "@/src/theme/spacing";
import { Customer } from "@/src/types/customer";
import { formatAddress } from "@/src/utils/formatAddress";

type ManagementCustomerCardProps = {
  customer: Customer;
  onPress: () => void;
  deleting: boolean;
  onDelete: () => void;
};

export function ManagementCustomerCard(props: ManagementCustomerCardProps) {
  const colors = useThemeColors();

  return (
    <Pressable accessibilityRole="button" onPress={props.onPress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <AppCard contentStyle={styles.card}>
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
        <Pressable
          disabled={props.deleting}
          onPress={props.onDelete}
          style={[styles.actionButton, { borderColor: colors.dangerBorder, opacity: props.deleting ? 0.5 : 1 }]}
        >
          {props.deleting ? <ActivityIndicator color={colors.danger} size="small" /> : <Delete20Regular color={colors.danger} />}
        </Pressable>
        <ArrowRight20Regular color={colors.mutedText} style={I18nManager.isRTL ? styles.arrowRtl : undefined} />
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: 76,
  },
  pressed: {
    opacity: 0.72,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowRtl: { transform: [{ scaleX: -1 }] },
});

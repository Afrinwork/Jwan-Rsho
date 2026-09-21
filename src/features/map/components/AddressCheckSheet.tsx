import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { mapT } from "@/src/features/map/i18n/mapT";

import { AppBadge } from "@/src/components/ui/AppBadge";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { CustomerNeedingAddressCheck } from "@/src/features/map/types/mapTypes";

type AddressCheckSheetProps = {
  visible: boolean;
  customers: CustomerNeedingAddressCheck[];
  onEditCustomer: (customerId: string) => void;
  onClose: () => void;
};

export function AddressCheckSheet(props: AddressCheckSheetProps) {
  const colors = useThemeColors();
  const t = mapT;

  return (
    <Modal animationType="slide" onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={styles.overlay}>
        <Pressable onPress={props.onClose} style={styles.backdrop} />
        <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
          <AppText style={styles.title} variant="heading">
            {t("addressCheck.title")}
          </AppText>
          <AppText color="muted" style={styles.subtitle} variant="body">
            {t("addressCheck.subtitle")}
          </AppText>
          <ScrollView contentContainerStyle={styles.content}>
            {props.customers.length === 0 ? (
              <EmptyState message={t("addressCheck.emptyMessage")} title={t("addressCheck.emptyTitle")} />
            ) : (
              props.customers.map((customer) => (
                <View key={customer.id} style={[styles.row, { borderColor: colors.border }]}>
                  <View style={styles.rowText}>
                    <AppText variant="bodyMedium">{customer.fullName}</AppText>
                    <AppText color="muted" variant="caption">
                      {customer.address || t("addressCheck.noAddress")}
                    </AppText>
                    <AppBadge label={t("addressCheck.openOrderBadge", { count: customer.openOrderCount })} tone="warning" />
                  </View>
                  <AppButton
                    label={t("addressCheck.editButton")}
                    onPress={() => props.onEditCustomer(customer.id)}
                    size="compact"
                    variant="secondary"
                  />
                </View>
              ))
            )}
          </ScrollView>
          <View style={styles.footer}>
            <AppButton label={t("common.close")} onPress={props.onClose} variant="secondary" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", writingDirection: "ltr" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.28)" },
  sheet: { maxHeight: "82%", borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0 },
  handleWrap: { alignItems: "center", paddingTop: spacing.sm, paddingBottom: spacing.xs },
  handle: { width: 44, height: 5, borderRadius: 999 },
  title: { paddingHorizontal: spacing.md },
  subtitle: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
  },
  rowText: { flex: 1, gap: 4 },
  footer: { padding: spacing.md },
});

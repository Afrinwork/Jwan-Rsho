import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { mapT } from "@/src/features/map/i18n/mapT";

import { AppButton } from "@/src/components/ui/AppButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { SelectedCustomerRow } from "@/src/features/map/components/SelectedCustomerRow";
import { SelectionProductTotals } from "@/src/features/map/components/SelectionProductTotals";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { ProductTotal } from "@/src/types/productTotal";

type SelectedCustomersListProps = {
  visible: boolean;
  markers: MapCustomerMarker[];
  totals: ProductTotal[];
  totalsLoading: boolean;
  onRemove: (markerId: string) => void;
  onClose: () => void;
};

export function SelectedCustomersList(props: SelectedCustomersListProps) {
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
          <ScrollView contentContainerStyle={styles.content}>
            {props.markers.length === 0 ? (
              <EmptyState message={t("selectedList.emptyMessage")} title={t("selectedList.emptyTitle")} />
            ) : (
              <>
                <SelectionProductTotals loading={props.totalsLoading} totals={props.totals} />
                {props.markers.map((marker) => (
                  <SelectedCustomerRow key={marker.id} marker={marker} onRemove={() => props.onRemove(marker.id)} />
                ))}
              </>
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
  overlay: { flex: 1, justifyContent: "flex-end", direction: "ltr" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.28)" },
  sheet: { maxHeight: "82%", borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0 },
  handleWrap: { alignItems: "center", paddingTop: spacing.sm, paddingBottom: spacing.xs },
  handle: { width: 44, height: 5, borderRadius: 999 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  footer: { padding: spacing.md },
});

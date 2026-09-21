import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { CustomerMapCard } from "@/src/features/map/components/CustomerMapCard";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { MapCustomerDetails } from "@/src/features/map/types/mapTypes";

type MapCustomerSheetProps = {
  visible: boolean;
  details: MapCustomerDetails | null;
  loading: boolean;
  error: string | null;
  actionError?: string | null;
  actionSuccess?: string | null;
  onClose: () => void;
  onRetry: () => void;
  onEdit: () => void;
  onComplete?: () => void;
  completing?: boolean;
  onCall: () => void;
  onNavigate: () => void;
  onShare: () => void;
  onShareOrder: () => void;
  // Only provided for admin/super_admin on the plain map screen — a driver
  // has no one to assign, and route-live has no need for it either.
  onAssignDriver?: () => void;
  // Route-live context only: lets the driver skip the current stop right
  // from this sheet instead of only via the bottom action bar. Omitted (and
  // hidden) for the plain map screen, which has no stop sequence to skip.
  onSkip?: () => void;
  onSkipLabel?: string;
  // Route-live context only: undoes a previous skip/complete for this stop,
  // making it pending again. Omitted for a stop that isn't currently
  // skipped/completed, and for the plain map screen.
  onReactivate?: () => void;
};

export function MapCustomerSheet({
  visible,
  details,
  loading,
  error,
  actionError,
  actionSuccess,
  onClose,
  onRetry,
  onEdit,
  onComplete,
  completing,
  onCall,
  onNavigate,
  onShare,
  onShareOrder,
  onAssignDriver,
  onSkip,
  onSkipLabel,
  onReactivate,
}: MapCustomerSheetProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("map");
  const [showMore, setShowMore] = useState(false);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
          {loading ? <LoadingView label={t("sheet.loadingDetails")} /> : null}
          {!loading && error ? (
            <View style={styles.content}>
              <ErrorState message={error} />
              <AppButton label={t("common.retry")} onPress={onRetry} variant="secondary" />
            </View>
          ) : null}
          {!loading && !error && details ? (
            <ScrollView contentContainerStyle={styles.content}>
              <CustomerMapCard details={details} />
              {actionError ? <ErrorState message={actionError} /> : null}
              {actionSuccess ? <SuccessState message={actionSuccess} /> : null}
              <View style={styles.actions}>
                <AppButton label={t("sheet.navigation")} onPress={onNavigate} />
                {details.openOrders.length && onComplete ? (
                  <AppButton
                    label={
                      details.openOrders.length > 1
                        ? t("sheet.markAllCompleted", { count: details.openOrders.length })
                        : t("sheet.markCompleted")
                    }
                    loading={completing}
                    onPress={onComplete}
                    variant="secondary"
                  />
                ) : null}
                <AppButton
                  label={t(showMore ? "sheet.fewerActions" : "sheet.moreActions")}
                  onPress={() => setShowMore((current) => !current)}
                  size="compact"
                  variant="secondary"
                />
                {showMore ? (
                  <View style={styles.moreActions}>
                    <AppButton label={t("common.edit")} onPress={onEdit} size="compact" variant="secondary" />
                    <AppButton label={details.customer.phone ? t("sheet.callPhone") : t("sheet.phoneMissing")} onPress={onCall} size="compact" variant="secondary" />
                    <AppButton label={t("sheet.shareViaWhatsapp")} onPress={onShareOrder} size="compact" variant="secondary" />
                    <AppButton label={t("sheet.shareLocation")} onPress={onShare} size="compact" variant="secondary" />
                    {onAssignDriver ? <AppButton label={t("sheet.assignDriver")} onPress={onAssignDriver} size="compact" variant="secondary" /> : null}
                    {onReactivate ? <AppButton label={t("sheet.reactivateStop")} onPress={onReactivate} size="compact" variant="secondary" /> : null}
                    {onSkip ? <AppButton label={onSkipLabel ?? t("sheet.skipStop")} onPress={onSkip} size="compact" variant="secondary" /> : null}
                  </View>
                ) : null}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    direction: "ltr",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  sheet: {
    maxHeight: "78%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: spacing.lg,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  moreActions: {
    gap: spacing.sm,
  },
});

import { MapDrive20Regular } from "@fluentui/react-native-icons";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { mapT } from "@/src/features/map/i18n/mapT";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type SelectedCustomersBarProps = {
  selectedCount: number;
  sharing: boolean;
  emailing: boolean;
  deleting: boolean;
  shareError: string | null;
  deleteError: string | null;
  previewCustomerCount?: number;
  previewOpenOrderCount?: number;
  loadingSelectionData?: boolean;
  onViewSelection: () => void;
  onOpenRoute: () => void;
  onShare: () => void;
  onShareByEmail: () => void;
  onAssignDriver?: () => void;
  assigningDriver?: boolean;
  onDeleteSelected: () => void;
  inline?: boolean;
};

export function SelectedCustomersBar(props: SelectedCustomersBarProps) {
  const t = mapT;
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);

  if (props.selectedCount === 0) {
    return null;
  }

  return (
    <View style={[styles.container, props.inline ? styles.inlineContainer : null]}>
      <View style={styles.triggerRow}>
        <Pressable
          onPress={() => setOpen((value) => !value)}
          style={[
            styles.dropdownChip,
            props.inline ? styles.inlineChip : null,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <AppText style={styles.dropdownLabel} variant="caption">
            {t("selectedBar.count", { count: props.selectedCount })} {open ? "^" : "v"}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityLabel={t("selectedBar.route")}
          onPress={props.onOpenRoute}
          style={[styles.routeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <MapDrive20Regular color={colors.primary} />
        </Pressable>
      </View>
      {props.shareError ? <ErrorState message={props.shareError} /> : null}
      {props.deleteError ? <ErrorState message={props.deleteError} /> : null}
      {open ? (
        <AppCard contentStyle={styles.menu} frosted style={props.inline ? styles.inlineMenu : undefined}>
          <AppText variant="label">{t("selectedBar.count", { count: props.selectedCount })}</AppText>
          <AppText variant="caption">
            {t("selectedBar.summary", {
              customers: props.previewCustomerCount ?? props.selectedCount,
              orders: props.previewOpenOrderCount ?? 0,
            })}
          </AppText>
          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <AppButton
                disabled={props.loadingSelectionData || props.emailing}
                label={t("selectedBar.whatsapp")}
                loading={props.sharing}
                onPress={props.onShare}
                size="compact"
              />
            </View>
            <View style={styles.actionButton}>
              <AppButton label={t("selectedBar.view")} onPress={props.onViewSelection} size="compact" variant="secondary" />
            </View>
            <View style={styles.actionButton}>
              <AppButton
                label={t("selectedBar.email")}
                disabled={props.loadingSelectionData || props.sharing}
                loading={props.emailing}
                onPress={props.onShareByEmail}
                size="compact"
                variant="secondary"
              />
            </View>
            {props.onAssignDriver ? (
              <View style={styles.actionButton}>
                <AppButton
                  label={t("selectedBar.assignDriver")}
                  loading={props.assigningDriver}
                  onPress={props.onAssignDriver}
                  size="compact"
                  variant="secondary"
                />
              </View>
            ) : null}
            <View style={styles.actionButton}>
              <AppButton
                label={t("selectedBar.clear")}
                loading={props.deleting}
                onPress={props.onDeleteSelected}
                size="compact"
                variant="danger"
              />
            </View>
          </View>
        </AppCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  inlineContainer: {
    flexBasis: "auto",
    alignSelf: "flex-start",
  },
  triggerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  routeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownChip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  inlineChip: {
    minWidth: 96,
  },
  dropdownLabel: {
    fontWeight: "700",
  },
  menu: { padding: spacing.sm, gap: spacing.xs },
  inlineMenu: {
    minWidth: 280,
    maxWidth: 340,
  },
  actions: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  actionButton: { flex: 1, minWidth: "47%" },
});

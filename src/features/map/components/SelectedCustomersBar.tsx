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
  shareError: string | null;
  onViewSelection: () => void;
  onShare: () => void;
  onShareByEmail: () => void;
  onResetSelection: () => void;
  inline?: boolean;
};

export function SelectedCustomersBar(props: SelectedCustomersBarProps) {
  const t = mapT;
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const shareLabel = "\u0645\u0634\u0627\u0631\u0643\u0629";

  if (props.selectedCount === 0) {
    return null;
  }

  return (
    <View style={[styles.container, props.inline ? styles.inlineContainer : null]}>
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
          {shareLabel} {open ? "^" : "v"}
        </AppText>
      </Pressable>
      {props.shareError ? <ErrorState message={props.shareError} /> : null}
      {open ? (
        <AppCard contentStyle={styles.menu} frosted style={props.inline ? styles.inlineMenu : undefined}>
          <AppText variant="label">{t("selectedBar.count", { count: props.selectedCount })}</AppText>
          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <AppButton label={t("selectedBar.view")} onPress={props.onViewSelection} size="compact" variant="secondary" />
            </View>
            <View style={styles.actionButton}>
              <AppButton label={t("selectedBar.whatsapp")} loading={props.sharing} onPress={props.onShare} size="compact" />
            </View>
            <View style={styles.actionButton}>
              <AppButton
                label={t("selectedBar.email")}
                loading={props.emailing}
                onPress={props.onShareByEmail}
                size="compact"
                variant="secondary"
              />
            </View>
            <View style={styles.actionButton}>
              <AppButton label={t("selectedBar.clear")} onPress={props.onResetSelection} size="compact" variant="secondary" />
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

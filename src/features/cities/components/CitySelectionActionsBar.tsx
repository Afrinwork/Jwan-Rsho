import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type CitySelectionActionsBarProps = {
  selectedCount: number;
  sharing: boolean;
  emailing: boolean;
  completingAll: boolean;
  actionError: string | null;
  onShare: () => void;
  onShareByEmail: () => void;
  onCompleteAll: () => void;
};

export function CitySelectionActionsBar(props: CitySelectionActionsBarProps) {
  const { t } = useTranslation("cities");
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);

  if (props.selectedCount === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        style={[
          styles.dropdownChip,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <AppText style={styles.dropdownLabel} variant="caption">
          مشاركة {open ? "^" : "v"}
        </AppText>
      </Pressable>
      {props.actionError ? <ErrorState durationMs={4200} message={props.actionError} /> : null}
      {open ? (
        <View
          style={[
            styles.menu,
            {
              backgroundColor: colors.surfaceMuted,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.actionButton}>
            <AppButton label={t("selectionActions.whatsapp", { defaultValue: "WhatsApp" })} loading={props.sharing} onPress={props.onShare} size="compact" />
          </View>
          <View style={styles.actionButton}>
            <AppButton
              label={t("selectionActions.email", { defaultValue: "E-Mail" })}
              loading={props.emailing}
              onPress={props.onShareByEmail}
              size="compact"
              variant="secondary"
            />
          </View>
          <View style={styles.actionButton}>
            <AppButton
              label={t("selectionActions.completeAll", { defaultValue: "Alle erledigen" })}
              loading={props.completingAll}
              onPress={props.onCompleteAll}
              size="compact"
              variant="success"
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  dropdownChip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  dropdownLabel: {
    fontWeight: "700",
  },
  menu: {
    minWidth: 220,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  actionButton: {
    width: "100%",
  },
});

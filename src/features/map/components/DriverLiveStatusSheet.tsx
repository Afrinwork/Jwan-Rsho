import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { spacing } from "@/src/constants/spacing";
import { radius } from "@/src/theme/radius";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type DriverLiveStatusSheetProps = {
  visible: boolean;
  odometer: string;
  sending: boolean;
  error: string | null;
  success: string | null;
  onChangeOdometer: (value: string) => void;
  onClose: () => void;
  onSend: () => void;
};

export function DriverLiveStatusSheet(props: DriverLiveStatusSheetProps) {
  const { t } = useTranslation("map");
  const colors = useThemeColors();

  return (
    <Modal animationType="slide" onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={styles.overlay}>
        <Pressable onPress={props.onClose} style={styles.backdrop} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText variant="heading">{t("driverStatus.title")}</AppText>
          <AppText color="muted" variant="body">{t("driverStatus.subtitle")}</AppText>
          <View style={[styles.info, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <AppText color="secondary" variant="caption">{t("driverStatus.addressAuto")}</AppText>
            <AppText color="muted" variant="caption">{t("driverStatus.managementNote")}</AppText>
          </View>
          <AppInput
            keyboardType="decimal-pad"
            onChangeText={props.onChangeOdometer}
            placeholder={t("driverStatus.odometerPlaceholder")}
            value={props.odometer}
          />
          {props.error ? <ErrorState message={props.error} /> : null}
          {props.success ? <SuccessState message={props.success} /> : null}
          <AppButton label={t("driverStatus.send")} loading={props.sending} onPress={props.onSend} />
          <AppButton label={t("common.close")} onPress={props.onClose} variant="secondary" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.28)" },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderWidth: 1, borderBottomWidth: 0, gap: spacing.sm, padding: spacing.md },
  info: { borderRadius: radius.md, borderWidth: 1, gap: spacing.xxs, padding: spacing.sm },
});

import { useState } from "react";
import { Modal, StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppInput } from "@/src/components/ui/AppInput";
import { AppText } from "@/src/components/ui/AppText";
import { routeT } from "@/src/features/route/i18n/routeT";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { spacing } from "@/src/theme/spacing";

type RouteMoveStopDialogProps = {
  // null = hidden. Keyed by the caller so the input resets per stop.
  stop: { name: string; position: number } | null;
  totalCount: number;
  onConfirm: (position: number) => void;
  onCancel: () => void;
};

// "Move customer 3 to position 15" — a typed target position instead of
// dragging, so long routes don't need endless scrolling while holding a row.
export function RouteMoveStopDialog(props: RouteMoveStopDialogProps) {
  const t = routeT;
  const colors = useThemeColors();
  const [draft, setDraft] = useState(props.stop ? String(props.stop.position) : "");
  const parsed = Number.parseInt(draft, 10);
  const isValid = Number.isInteger(parsed) && parsed >= 1 && parsed <= props.totalCount;

  return (
    <Modal animationType="fade" onRequestClose={props.onCancel} transparent visible={props.stop !== null}>
      <View style={styles.backdrop}>
        <AppCard contentStyle={styles.card} frosted style={{ backgroundColor: colors.surfaceElevated }}>
          <AppText variant="heading">{t("manualOrder.dialogTitle", { name: props.stop?.name ?? "" })}</AppText>
          <AppText color="muted" variant="body">
            {t("manualOrder.dialogMessage", { position: props.stop?.position ?? 0, count: props.totalCount })}
          </AppText>
          <AppInput
            autoFocus
            keyboardType="number-pad"
            maxLength={4}
            onChangeText={setDraft}
            onSubmitEditing={() => {
              if (isValid) props.onConfirm(parsed);
            }}
            placeholder={`1 – ${props.totalCount}`}
            returnKeyType="done"
            selectTextOnFocus
            value={draft}
          />
          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <AppButton label={t("common:cancel")} onPress={props.onCancel} variant="secondary" />
            </View>
            <View style={styles.actionButton}>
              <AppButton disabled={!isValid} label={t("manualOrder.dialogConfirm")} onPress={() => props.onConfirm(parsed)} />
            </View>
          </View>
        </AppCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: spacing.lg,
  },
  card: { width: "100%", maxWidth: 360, padding: spacing.lg, gap: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  actionButton: { flex: 1 },
});

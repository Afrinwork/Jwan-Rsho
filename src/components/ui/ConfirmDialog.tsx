import { Modal, StyleSheet, View } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { ConfirmPanel, ConfirmPanelProps } from "@/src/components/ui/ConfirmPanel";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { spacing } from "@/src/theme/spacing";

type ConfirmDialogProps = ConfirmPanelProps & {
  visible: boolean;
};

export function ConfirmDialog({ visible, ...panel }: ConfirmDialogProps) {
  const colors = useThemeColors();

  return (
    <Modal animationType="fade" onRequestClose={panel.onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <AppCard contentStyle={styles.card} frosted style={{ backgroundColor: colors.surfaceElevated }}>
          <ConfirmPanel {...panel} />
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
  card: {
    width: "100%",
    maxWidth: 360,
    padding: spacing.lg,
  },
});

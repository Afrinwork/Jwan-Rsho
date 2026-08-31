import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CheckmarkCircle20Regular } from "@fluentui/react-native-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { routeT } from "@/src/features/route/i18n/routeT";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type RouteSelectionActionsBarProps = {
  selectedCount: number;
  sharing: boolean;
  completingAll: boolean;
  actionError: string | null;
  onShare: () => void;
  onCompleteAll: () => void;
};

export function RouteSelectionActionsBar(props: RouteSelectionActionsBarProps) {
  const t = routeT;
  const colors = useThemeColors();

  if (props.selectedCount === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={t("selectionActions.whatsapp")}
        disabled={props.sharing}
        onPress={props.onShare}
        style={[
          styles.whatsappButton,
          {
            backgroundColor: "#25D366",
            borderColor: "#1FA855",
            opacity: props.sharing ? 0.6 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons color="#FFFFFF" name="whatsapp" size={22} />
      </Pressable>
      <Pressable
        accessibilityLabel={t("selectionActions.completeAll")}
        disabled={props.completingAll}
        onPress={props.onCompleteAll}
        style={[
          styles.completeButton,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.primaryStrong,
            opacity: props.completingAll ? 0.6 : 1,
          },
        ]}
      >
        <CheckmarkCircle20Regular color={colors.primary} />
        <AppText style={styles.completeLabel} variant="caption">
          {t("selectionActions.completeAll")}
        </AppText>
      </Pressable>
      {props.actionError ? <ErrorState durationMs={4200} message={props.actionError} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" },
  whatsappButton: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButton: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  completeLabel: { fontWeight: "700" },
});

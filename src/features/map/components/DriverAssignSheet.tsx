import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { spacing } from "@/src/constants/spacing";
import { radius } from "@/src/theme/radius";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { UserProfile } from "@/src/types/user";

type DriverAssignContentProps = {
  drivers: UserProfile[];
  loadingDrivers: boolean;
  assigning: boolean;
  error: string | null;
  currentDriverId?: string;
  customerCount?: number;
  // Label of the "no driver" option (default: "no assignment").
  noneLabel?: string;
  onSelect: (driverId: string | null) => void;
  onClose: () => void;
};

type DriverAssignSheetProps = DriverAssignContentProps & {
  visible: boolean;
};

export function DriverAssignSheet({ visible, ...content }: DriverAssignSheetProps) {
  const colors = useThemeColors();

  return (
    <Modal animationType="fade" onRequestClose={content.onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <DriverAssignContent {...content} />
        </View>
      </View>
    </Modal>
  );
}

// The driver list without a Modal of its own, so it can also be shown inside
// an already open sheet (a second Modal on top freezes the app there).
export function DriverAssignContent({
  drivers,
  loadingDrivers,
  assigning,
  error,
  currentDriverId,
  customerCount,
  noneLabel,
  onSelect,
  onClose,
}: DriverAssignContentProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("map");

  return (
    <View style={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>{t("driverAssignSheet.title")}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        {customerCount && customerCount > 1
          ? t("driverAssignSheet.subtitleMultiple", { count: customerCount })
          : t("driverAssignSheet.subtitle")}
      </Text>
      {error ? <ErrorState message={error} /> : null}
      {loadingDrivers ? (
        <LoadingView label={t("driverAssignSheet.loading")} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <DriverOption
            active={!currentDriverId}
            colors={colors}
            disabled={assigning}
            label={noneLabel ?? t("driverAssignSheet.noneOption")}
            onPress={() => onSelect(null)}
          />
          {!drivers.length ? (
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>{t("driverAssignSheet.emptyMessage")}</Text>
          ) : null}
          {drivers.map((driver) => (
            <DriverOption
              active={currentDriverId === driver.id}
              colors={colors}
              disabled={assigning}
              key={driver.id}
              label={driver.fullName}
              onPress={() => onSelect(driver.id)}
            />
          ))}
        </ScrollView>
      )}
      <AppButton label={t("common.close")} onPress={onClose} size="compact" variant="secondary" />
    </View>
  );
}

type DriverOptionProps = {
  active: boolean;
  label: string;
  disabled: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
};

function DriverOption({ active, label, disabled, onPress, colors }: DriverOptionProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.option,
        {
          backgroundColor: active ? colors.primaryMuted : colors.surfaceElevated,
          borderColor: active ? colors.primary : colors.border,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <Text style={[styles.optionLabel, { color: active ? colors.primary : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.28)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    borderWidth: 1,
    borderRadius: radius.card,
    maxHeight: "70%",
    padding: spacing.md,
  },
  content: {
    flexShrink: 1,
    gap: spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
  },
  list: {
    gap: spacing.xs,
  },
  option: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    paddingVertical: spacing.sm,
  },
});

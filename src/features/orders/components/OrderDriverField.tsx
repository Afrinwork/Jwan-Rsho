import { ChevronDown20Regular } from "@fluentui/react-native-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";

import { FormField } from "@/src/components/forms/FormField";
import { spacing } from "@/src/constants/spacing";
import { DriverAssignSheet } from "@/src/features/map/components/DriverAssignSheet";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { UserProfile } from "@/src/types/user";

type OrderDriverFieldProps = {
  drivers: UserProfile[];
  loadingDrivers: boolean;
  error: string | null;
  driverId: string | null;
  onChange: (driverId: string | null) => void;
};

// Admin-only: picks the driver the order's customer is assigned to on save.
// Compact select sized to sit next to the city field. "No driver" is shown
// as the admin themself (the default): such a customer stays on the admin's
// own map, which already shows all their open orders live.
export function OrderDriverField({ drivers, loadingDrivers, error, driverId, onChange }: OrderDriverFieldProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("orders");
  const [pickerVisible, setPickerVisible] = useState(false);
  const selectedDriver = drivers.find((driver) => driver.id === driverId);
  const ownName = useCurrentUser()?.displayName?.trim();
  const selfLabel = ownName ? t("driverSection.self", { name: ownName }) : t("driverSection.none");

  return (
    <FormField label={t("driverSection.title")}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setPickerVisible(true)}
        style={[styles.trigger, { backgroundColor: colors.surfaceElevated, borderColor: selectedDriver ? colors.primary : colors.border }]}
      >
        <Text numberOfLines={1} style={[styles.triggerLabel, { color: selectedDriver ? colors.text : colors.mutedText }]}>
          {selectedDriver?.fullName ?? selfLabel}
        </Text>
        <ChevronDown20Regular color={colors.mutedText} />
      </Pressable>
      <DriverAssignSheet
        assigning={false}
        currentDriverId={driverId ?? undefined}
        drivers={drivers}
        error={error}
        loadingDrivers={loadingDrivers}
        noneLabel={selfLabel}
        onClose={() => setPickerVisible(false)}
        onSelect={(nextDriverId) => {
          onChange(nextDriverId);
          setPickerVisible(false);
        }}
        visible={pickerVisible}
      />
    </FormField>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  triggerLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
});

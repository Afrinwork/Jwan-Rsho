import { ChevronDown20Regular } from "@fluentui/react-native-icons";
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { routeT } from "@/src/features/route/i18n/routeT";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type RouteLastStopOption = { id: string; name: string };

type RouteLastStopDropdownProps = {
  options: RouteLastStopOption[];
  // null = no pinned last stop, order stays fully automatic.
  value: string | null;
  onChange: (value: string | null) => void;
};

// Lets the driver override the automatic route ordering for exactly one
// stop: whichever customer is picked here always ends up last, no matter
// what the nearest-neighbor/Directions optimization would otherwise choose.
export function RouteLastStopDropdown(props: RouteLastStopDropdownProps) {
  const t = routeT;
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const selectedOption = props.options.find((option) => option.id === props.value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
      >
        <AppText numberOfLines={1} style={styles.triggerLabel} variant="label">
          {selectedOption ? selectedOption.name : t("startCard.lastStopAuto")}
        </AppText>
        <ChevronDown20Regular color={colors.mutedText} />
      </Pressable>
      <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="label">{t("startCard.lastStopLabel")}</AppText>
            <FlatList
              data={[{ id: null, name: t("startCard.lastStopAuto") }, ...props.options]}
              keyExtractor={(item) => item.id ?? "auto"}
              renderItem={({ item }) => {
                const active = item.id === props.value;
                return (
                  <Pressable
                    onPress={() => {
                      props.onChange(item.id);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      { backgroundColor: active ? colors.primaryMuted : "transparent", borderColor: active ? colors.primary : "transparent" },
                    ]}
                  >
                    <AppText color={active ? "primary" : "default"} numberOfLines={1} variant="body">
                      {item.name}
                    </AppText>
                  </Pressable>
                );
              }}
              style={styles.list}
            />
            <AppButton label={t("common:cancel")} onPress={() => setOpen(false)} size="compact" variant="secondary" />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xxs,
  },
  triggerLabel: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.18)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    borderWidth: 1,
    borderRadius: radius.card,
    maxHeight: "70%",
    padding: spacing.md,
    gap: spacing.sm,
  },
  list: { flexGrow: 0 },
  option: {
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});

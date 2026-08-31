import { ChevronDown20Regular } from "@fluentui/react-native-icons";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { routeT } from "@/src/features/route/i18n/routeT";
import { formatHourMinute } from "@/src/features/route/utils/routeFormat";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

const MINUTE_STEP = 15;
const OPTION_HEIGHT = 44;

const TIME_OPTIONS = Array.from({ length: (24 * 60) / MINUTE_STEP }, (_, index) => {
  const totalMinutes = index * MINUTE_STEP;
  return formatHourMinute(Math.floor(totalMinutes / 60), totalMinutes % 60);
});

type RouteTimeDropdownProps = {
  value: string;
  onChange: (value: string) => void;
};

export function RouteTimeDropdown(props: RouteTimeDropdownProps) {
  const t = routeT;
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const selectedIndex = useMemo(() => Math.max(TIME_OPTIONS.indexOf(props.value), 0), [props.value]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
      >
        <AppText style={styles.triggerLabel} variant="label">
          {props.value}
        </AppText>
        <ChevronDown20Regular color={colors.mutedText} />
      </Pressable>
      <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="label">{t("startCard.departureTimeLabel")}</AppText>
            <FlatList
              data={TIME_OPTIONS}
              getItemLayout={(_, index) => ({ length: OPTION_HEIGHT, offset: OPTION_HEIGHT * index, index })}
              initialScrollIndex={selectedIndex}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const active = item === props.value;
                return (
                  <Pressable
                    onPress={() => {
                      props.onChange(item);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      { backgroundColor: active ? colors.primaryMuted : "transparent", borderColor: active ? colors.primary : "transparent" },
                    ]}
                  >
                    <AppText color={active ? "primary" : "default"} variant="body">
                      {item}
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
    minWidth: 96,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
  },
  triggerLabel: { fontVariant: ["tabular-nums"] },
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
    height: OPTION_HEIGHT,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
});

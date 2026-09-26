import { AddCircle20Regular, ArrowDown20Regular, ArrowUp20Regular, ChevronDown20Regular, Dismiss20Regular } from "@fluentui/react-native-icons";
import { ReactNode, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";
import { WhatsappMessageComponent } from "@/src/types/userPreferences";

const ALL_COMPONENTS: WhatsappMessageComponent[] = ["name", "address", "phone", "orders", "thankYou", "eta"];

type WhatsappComponentsDropdownProps = {
  // Chosen building blocks IN MESSAGE ORDER — the array order is what the
  // formatter (mapShareFormatterService) renders each customer block in.
  value: WhatsappMessageComponent[];
  onChange: (value: WhatsappMessageComponent[]) => void;
};

// Chooses which building blocks the WhatsApp selection message's
// per-customer block is made of AND their order: chosen blocks are listed
// on top in message order (arrows move them, ✕ removes), the rest below
// can be added (appended at the end). Every change updates the live
// preview below it right away.
export function WhatsappComponentsDropdown({ value, onChange }: WhatsappComponentsDropdownProps) {
  const { t } = useTranslation("management");
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const chosen = [...new Set(value)];
  const available = ALL_COMPONENTS.filter((component) => !chosen.includes(component));

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= chosen.length) return;
    const next = [...chosen];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function iconButton(label: string, onPress: () => void, icon: ReactNode) {
    return (
      <Pressable
        accessibilityLabel={label}
        hitSlop={6}
        onPress={onPress}
        style={[styles.iconButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
      >
        {icon}
      </Pressable>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
      >
        <View style={styles.triggerText}>
          <AppText numberOfLines={1} variant="label">
            {t("whatsappTemplate.componentsSummary", { count: chosen.length, total: ALL_COMPONENTS.length })}
          </AppText>
          {chosen.length ? (
            <AppText color="muted" numberOfLines={1} variant="caption">
              {chosen.map((component) => t(`whatsappTemplate.component.${component}`)).join(" → ")}
            </AppText>
          ) : null}
        </View>
        <ChevronDown20Regular color={colors.mutedText} />
      </Pressable>
      <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="label">{t("whatsappTemplate.componentsLabel")}</AppText>
            <AppText color="muted" variant="caption">
              {t("whatsappTemplate.componentsOrderHint")}
            </AppText>
            <ScrollView style={styles.list}>
              {chosen.map((component, index) => (
                <View
                  key={component}
                  style={[styles.option, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}
                >
                  <AppText color="primary" style={styles.position} variant="label">
                    {index + 1}
                  </AppText>
                  <AppText color="primary" numberOfLines={1} style={styles.optionLabel} variant="body">
                    {t(`whatsappTemplate.component.${component}`)}
                  </AppText>
                  {index > 0
                    ? iconButton(t("whatsappTemplate.moveUp"), () => move(index, -1), <ArrowUp20Regular color={colors.primary} />)
                    : null}
                  {index < chosen.length - 1
                    ? iconButton(t("whatsappTemplate.moveDown"), () => move(index, 1), <ArrowDown20Regular color={colors.primary} />)
                    : null}
                  {iconButton(
                    t("whatsappTemplate.removeComponent"),
                    () => onChange(chosen.filter((item) => item !== component)),
                    <Dismiss20Regular color={colors.mutedText} />,
                  )}
                </View>
              ))}
              {available.length ? (
                <AppText color="muted" style={styles.availableLabel} variant="caption">
                  {t("whatsappTemplate.componentsAvailable")}
                </AppText>
              ) : null}
              {available.map((component) => (
                <Pressable
                  key={component}
                  onPress={() => onChange([...chosen, component])}
                  style={[styles.option, { borderColor: colors.border }]}
                >
                  <AppText numberOfLines={1} style={styles.optionLabel} variant="body">
                    {t(`whatsappTemplate.component.${component}`)}
                  </AppText>
                  <AddCircle20Regular color={colors.primary} />
                </Pressable>
              ))}
            </ScrollView>
            <AppButton label={t("common:close")} onPress={() => setOpen(false)} size="compact" />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xxs,
  },
  triggerText: { flex: 1, gap: 2 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.18)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    borderWidth: 1,
    borderRadius: radius.card,
    maxHeight: "80%",
    padding: spacing.md,
    gap: spacing.sm,
  },
  list: { flexGrow: 0 },
  option: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xxs,
  },
  position: { width: 18, textAlign: "center" },
  optionLabel: { flex: 1 },
  availableLabel: { marginTop: spacing.xs, marginBottom: spacing.xxs },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

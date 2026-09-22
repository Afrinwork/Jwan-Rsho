import { ChevronDown20Regular, Checkmark20Regular } from "@fluentui/react-native-icons";
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";
import { WhatsappMessageComponent } from "@/src/types/userPreferences";

const ALL_COMPONENTS: WhatsappMessageComponent[] = ["name", "address", "phone", "orders", "thankYou", "eta"];

type WhatsappComponentsDropdownProps = {
  value: WhatsappMessageComponent[];
  onChange: (value: WhatsappMessageComponent[]) => void;
};

// Multi-select "dropdown" (a full-screen-anchored checklist sheet, since a
// native multi-select Picker doesn't exist on either platform) for choosing
// which building blocks the WhatsApp selection message's per-customer block
// is made of -- toggling one immediately updates the live preview below it.
export function WhatsappComponentsDropdown({ value, onChange }: WhatsappComponentsDropdownProps) {
  const { t } = useTranslation("management");
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const selected = new Set(value);

  function toggle(component: WhatsappMessageComponent) {
    const next = new Set(selected);
    if (next.has(component)) {
      next.delete(component);
    } else {
      next.add(component);
    }
    onChange(ALL_COMPONENTS.filter((item) => next.has(item)));
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
      >
        <AppText numberOfLines={1} style={styles.triggerLabel} variant="label">
          {t("whatsappTemplate.componentsSummary", { count: selected.size, total: ALL_COMPONENTS.length })}
        </AppText>
        <ChevronDown20Regular color={colors.mutedText} />
      </Pressable>
      <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="label">{t("whatsappTemplate.componentsLabel")}</AppText>
            <FlatList
              data={ALL_COMPONENTS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const active = selected.has(item);
                return (
                  <Pressable
                    onPress={() => toggle(item)}
                    style={[
                      styles.option,
                      { backgroundColor: active ? colors.primaryMuted : "transparent", borderColor: active ? colors.primary : colors.border },
                    ]}
                  >
                    <AppText color={active ? "primary" : "default"} numberOfLines={1} style={styles.optionLabel} variant="body">
                      {t(`whatsappTemplate.component.${item}`)}
                    </AppText>
                    {active ? <Checkmark20Regular color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
              style={styles.list}
            />
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
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xxs,
  },
  optionLabel: { flex: 1 },
});

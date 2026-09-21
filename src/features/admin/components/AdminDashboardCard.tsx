import { MoreVertical20Regular, Person20Regular } from "@fluentui/react-native-icons";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";
import { UserProfile } from "@/src/types/user";

type AdminDashboardCardProps = {
  admin: UserProfile;
  busy: boolean;
  onOpenActions: () => void;
};

export function AdminDashboardCard({ admin, busy, onOpenActions }: AdminDashboardCardProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("admin");
  const isActive = admin.isActive !== false;

  return (
    <AppCard contentStyle={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <Person20Regular color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText numberOfLines={1} variant="subheading">
          {admin.fullName}
        </AppText>
        <AppText color="muted" numberOfLines={1} variant="caption">
          {admin.email}
        </AppText>
        {!isActive ? (
          <View style={[styles.badge, { backgroundColor: colors.dangerBackground }]}>
            <AppText color={colors.danger} variant="caption">
              {t("userActions.inactiveBadge")}
            </AppText>
          </View>
        ) : null}
      </View>
      <Pressable
        disabled={busy}
        onPress={onOpenActions}
        style={[styles.actionsWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: busy ? 0.5 : 1 }]}
      >
        {busy ? <ActivityIndicator color={colors.primary} size="small" /> : <MoreVertical20Regular color={colors.text} />}
      </Pressable>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: 2,
  },
  actionsWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

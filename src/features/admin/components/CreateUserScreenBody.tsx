import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";

import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { CreateUserForm } from "@/src/features/admin/components/CreateUserForm";
import { AdminSectionHeader } from "@/src/features/admin/components/AdminSectionHeader";
import { spacing } from "@/src/theme/spacing";

export function CreateUserScreenBody() {
  const { t } = useTranslation("admin");

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoiding}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AdminSectionHeader subtitle={t("createUser.subtitle")} title={t("createUser.title")} />
          <CreateUserForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: { flex: 1 },
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
});

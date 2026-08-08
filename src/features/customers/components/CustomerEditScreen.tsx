import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { spacing } from "@/src/constants/spacing";
import { CustomerEditAddressSection } from "@/src/features/customers/components/CustomerEditAddressSection";
import { CustomerEditForm } from "@/src/features/customers/components/CustomerEditForm";
import { CustomerEditOrderItemsSection } from "@/src/features/customers/components/CustomerEditOrderItemsSection";
import { useCustomerEdit } from "@/src/features/customers/hooks/useCustomerEdit";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type CustomerEditScreenProps = {
  customerId: string;
};

export function CustomerEditScreen({ customerId }: CustomerEditScreenProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const { error, form, items, loading, saving, submit, successMessage } = useCustomerEdit(customerId);

  if (loading) {
    return <LoadingView label="Kunde wird zum Bearbeiten geladen..." />;
  }

  if (!customerId) {
    return <EmptyState message="Es wurde kein Kunde ausgewaehlt." title="Kein Kunde" />;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Kunde bearbeiten</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            Passe Kunde und offene Bestellung direkt aus der Karte heraus an.
          </Text>
        </View>
        {error ? <ErrorState message={error} /> : null}
        {successMessage ? <SuccessState message={successMessage} /> : null}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kundendaten</Text>
          <CustomerEditForm control={form.control} errors={form.formState.errors.customer} />
          <CustomerEditAddressSection control={form.control} errors={form.formState.errors.customer} />
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Offene Bestellung</Text>
          <CustomerEditOrderItemsSection
            append={items.append}
            control={form.control}
            errors={form.formState.errors.items}
            fields={items.fields}
            remove={items.remove}
            setValue={form.setValue}
          />
        </View>
        <View style={styles.actions}>
          <AppButton
            label="Speichern"
            loading={saving}
            onPress={() => {
              void submit().then((saved) => {
                if (saved) {
                  router.back();
                }
              });
            }}
          />
          <AppButton label="Zurueck zur Karte" onPress={() => router.back()} variant="secondary" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  actions: {
    gap: spacing.sm,
  },
});

import { useRouter } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { AppButton } from "@/src/components/ui/AppButton";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { FormSectionCard } from "@/src/components/ui/FormSectionCard";
import { spacing } from "@/src/constants/spacing";
import { CustomerEditAddressSection } from "@/src/features/customers/components/CustomerEditAddressSection";
import { CustomerEditForm } from "@/src/features/customers/components/CustomerEditForm";
import { CustomerEditOrderItemsSection } from "@/src/features/customers/components/CustomerEditOrderItemsSection";
import { useCustomerEdit } from "@/src/features/customers/hooks/useCustomerEdit";

type CustomerEditScreenProps = {
  customerId: string;
};

export function CustomerEditScreen({ customerId }: CustomerEditScreenProps) {
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
        <AnimatedEntrance>
          <CompactScreenHeader subtitle="Kunde und offene Bestellung anpassen." title="Kunde bearbeiten" />
        </AnimatedEntrance>
        {error ? <AnimatedEntrance delay={60}><ErrorState message={error} /></AnimatedEntrance> : null}
        {successMessage ? <AnimatedEntrance delay={90}><SuccessState message={successMessage} /></AnimatedEntrance> : null}
        <AnimatedEntrance delay={120}>
          <FormSectionCard subtitle="Persoenliche Daten und eine sauber strukturierte Zieladresse." title="Kunde & Adresse">
            <CustomerEditForm control={form.control} errors={form.formState.errors.customer} />
            <CustomerEditAddressSection control={form.control} errors={form.formState.errors.customer} />
          </FormSectionCard>
        </AnimatedEntrance>
        <AnimatedEntrance delay={160}>
          <CustomerEditOrderItemsSection
            append={items.append}
            control={form.control}
            errors={form.formState.errors.items}
            fields={items.fields}
            remove={items.remove}
            setValue={form.setValue}
          />
        </AnimatedEntrance>
        <AnimatedEntrance delay={200} style={styles.actions}>
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
        </AnimatedEntrance>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  actions: {
    gap: spacing.sm,
  },
});

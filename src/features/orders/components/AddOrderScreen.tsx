import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";

import { ErrorState } from "@/src/components/ui/ErrorState";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { spacing } from "@/src/constants/spacing";
import { CustomerModeSelector } from "@/src/features/orders/components/CustomerModeSelector";
import { ExistingCustomerSection } from "@/src/features/orders/components/ExistingCustomerSection";
import { NewCustomerSection } from "@/src/features/orders/components/NewCustomerSection";
import { OrderItemsSection } from "@/src/features/orders/components/OrderItemsSection";
import { SaveOrderButton } from "@/src/features/orders/components/SaveOrderButton";
import { useAddOrder } from "@/src/features/orders/hooks/useAddOrder";
import { useThemeColors } from "@/src/hooks/useThemeColors";

export function AddOrderScreen() {
  const {
    form,
    items,
    customerMode,
    setMode,
    selectedCustomer,
    selectCustomer,
    submit,
    submitError,
    successMessage,
  } = useAddOrder();
  const colors = useThemeColors();
  const errors = form.formState.errors;

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>Hinzufuegen</Text>
          <CustomerModeSelector mode={customerMode} onChange={setMode} />
          {customerMode === "existing" ? (
            <ExistingCustomerSection
              error={errors.customerId?.message}
              onSelect={selectCustomer}
              selectedCustomer={selectedCustomer}
            />
          ) : (
            <NewCustomerSection control={form.control} errors={errors.customer} />
          )}
          <OrderItemsSection
            append={items.append}
            control={form.control}
            errors={errors.items}
            fields={items.fields}
            remove={items.remove}
            setValue={form.setValue}
          />
          {submitError ? <ErrorState message={submitError} /> : null}
          {successMessage ? <SuccessState message={successMessage} /> : null}
          <SaveOrderButton isSubmitting={form.formState.isSubmitting} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
});

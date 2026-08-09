import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from "react-native";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
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
  const errors = form.formState.errors;

  function handleSave() {
    Keyboard.dismiss();
    setTimeout(() => {
      void submit();
    }, 120);
  }

  return (
    <ScreenContainer>
      <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
        <View style={styles.flex}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              keyboardShouldPersistTaps="always"
            >
              <AnimatedEntrance>
                <CompactScreenHeader subtitle="Bestellung direkt erfassen." title="Hinzufuegen" />
              </AnimatedEntrance>
              <AnimatedEntrance delay={60}>
                <CustomerModeSelector mode={customerMode} onChange={setMode} />
              </AnimatedEntrance>
              <AnimatedEntrance delay={110}>
                {customerMode === "existing" ? (
                  <ExistingCustomerSection
                    error={errors.customerId?.message}
                    onSelect={selectCustomer}
                    selectedCustomer={selectedCustomer}
                  />
                ) : (
                  <NewCustomerSection control={form.control} errors={errors.customer} />
                )}
              </AnimatedEntrance>
              <AnimatedEntrance delay={150}>
                <OrderItemsSection
                  append={items.append}
                  control={form.control}
                  errors={errors.items}
                  fields={items.fields}
                  remove={items.remove}
                  setValue={form.setValue}
                />
              </AnimatedEntrance>
              {submitError ? <AnimatedEntrance delay={190}><ErrorState message={submitError} /></AnimatedEntrance> : null}
              {successMessage ? <AnimatedEntrance delay={220}><SuccessState message={successMessage} /></AnimatedEntrance> : null}
              <AnimatedEntrance delay={250}>
                <SaveOrderButton isSubmitting={form.formState.isSubmitting} onPress={handleSave} />
              </AnimatedEntrance>
              <View style={styles.footerSpacer} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl * 3,
    flexGrow: 1,
  },
  footerSpacer: {
    height: spacing.xl * 2,
  },
});

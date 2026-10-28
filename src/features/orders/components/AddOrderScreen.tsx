import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { AppButton } from "@/src/components/ui/AppButton";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { spacing } from "@/src/constants/spacing";
import { AddressConfirmDialog } from "@/src/features/customers/components/AddressConfirmDialog";
import { isPreciseAddress } from "@/src/features/customers/services/addressNote";
import { CustomerSection } from "@/src/features/orders/components/CustomerSection";
import { DriverAddSuggestions } from "@/src/features/orders/components/DriverAddSuggestions";
import { OrderDriverField } from "@/src/features/orders/components/OrderDriverField";
import { OrderItemsSection } from "@/src/features/orders/components/OrderItemsSection";
import { SaveOrderButton } from "@/src/features/orders/components/SaveOrderButton";
import { useAddOrder } from "@/src/features/orders/hooks/useAddOrder";
import { isDriver } from "@/src/features/auth/permissions";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";

export function AddOrderScreen() {
  const { t } = useTranslation("orders");
  const currentUser = useCurrentUser();
  const {
    form,
    items,
    canAssignDriver,
    driverId,
    setDriverId,
    drivers,
    loadingDrivers,
    driversError,
    selectedCustomer,
    selectCustomer,
    clearCustomer,
    submit,
    submitToTrip,
    canAddToTrip,
    submitError,
    successMessage,
  } = useAddOrder();
  const errors = form.formState.errors;
  const [addressConfirmVisible, setAddressConfirmVisible] = useState(false);
  // Which save button was pressed, kept while the address is confirmed.
  const [addToTrip, setAddToTrip] = useState(false);

  function handleSave(toTrip: boolean) {
    Keyboard.dismiss();
    setAddToTrip(toTrip);
    setTimeout(() => {
      void saveAfterAddressCheck(toTrip);
    }, 120);
  }

  function save(toTrip: boolean) {
    void (toTrip ? submitToTrip() : submit());
  }

  // A valid form without street and house number is confirmed first;
  // an invalid one goes straight to submit, which shows the field errors.
  async function saveAfterAddressCheck(toTrip: boolean) {
    if ((await form.trigger()) && !isPreciseAddress(form.getValues("customer"))) {
      setAddressConfirmVisible(true);
      return;
    }
    save(toTrip);
  }

  return (
    <ScreenContainer>
      <View style={styles.flex}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            keyboardShouldPersistTaps="handled"
          >
            <AnimatedEntrance>
              <CompactScreenHeader title={t("common:add")} />
            </AnimatedEntrance>
            {isDriver(currentUser) ? (
              <AnimatedEntrance delay={40}>
                <DriverAddSuggestions onSelectCustomer={selectCustomer} />
              </AnimatedEntrance>
            ) : null}
            <AnimatedEntrance delay={60}>
              <CustomerSection
                control={form.control}
                customerIdError={errors.customerId?.message}
                driverField={
                  canAssignDriver ? (
                    <OrderDriverField
                      driverId={driverId}
                      drivers={drivers}
                      error={driversError}
                      loadingDrivers={loadingDrivers}
                      onChange={setDriverId}
                    />
                  ) : undefined
                }
                errors={errors.customer}
                onClearCustomer={clearCustomer}
                onSelectCustomer={selectCustomer}
                selectedCustomer={selectedCustomer}
              />
            </AnimatedEntrance>
            <AnimatedEntrance delay={150}>
              <OrderItemsSection
                append={items.append}
                control={form.control}
                errors={errors.items}
                fields={items.fields}
                remove={items.remove}
                setValue={form.setValue}
                update={items.update}
              />
            </AnimatedEntrance>
            {submitError ? <AnimatedEntrance delay={190}><ErrorState message={submitError} /></AnimatedEntrance> : null}
            {successMessage ? <AnimatedEntrance delay={220}><SuccessState message={successMessage} /></AnimatedEntrance> : null}
            <AnimatedEntrance delay={250}>
              <View style={styles.saveButtons}>
                <SaveOrderButton isSubmitting={form.formState.isSubmitting} onPress={() => handleSave(false)} />
                {canAddToTrip ? (
                  <AppButton
                    disabled={form.formState.isSubmitting}
                    label={t("save.addToTrip")}
                    onPress={() => handleSave(true)}
                    size="compact"
                    variant="secondary"
                  />
                ) : null}
              </View>
            </AnimatedEntrance>
            <View style={styles.footerSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      <AddressConfirmDialog
        onCancel={() => setAddressConfirmVisible(false)}
        onConfirm={() => {
          setAddressConfirmVisible(false);
          save(addToTrip);
        }}
        visible={addressConfirmVisible}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  saveButtons: {
    gap: spacing.sm,
  },
  footerSpacer: {
    height: spacing.md,
  },
});

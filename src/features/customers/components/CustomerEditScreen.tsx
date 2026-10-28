import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

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
import { AddressConfirmDialog } from "@/src/features/customers/components/AddressConfirmDialog";
import { CustomerEditAddressSection } from "@/src/features/customers/components/CustomerEditAddressSection";
import { CustomerEditForm } from "@/src/features/customers/components/CustomerEditForm";
import { CustomerEditOrderItemsSection } from "@/src/features/customers/components/CustomerEditOrderItemsSection";
import { useCustomerEdit } from "@/src/features/customers/hooks/useCustomerEdit";
import { isPreciseAddress } from "@/src/features/customers/services/addressNote";
import { OrderDriverField } from "@/src/features/orders/components/OrderDriverField";

type CustomerEditScreenProps = {
  customerId: string;
};

export function CustomerEditScreen({ customerId }: CustomerEditScreenProps) {
  const router = useRouter();
  const {
    error,
    form,
    hasOpenOrder,
    items,
    loading,
    saving,
    submit,
    successMessage,
    canAssignDriver,
    driverId,
    setDriverId,
    drivers,
    loadingDrivers,
    driversError,
  } = useCustomerEdit(customerId);
  const { t } = useTranslation("customers");
  const [addressConfirmVisible, setAddressConfirmVisible] = useState(false);

  function save() {
    void submit().then((saved) => {
      if (saved) {
        router.back();
      }
    });
  }

  // A valid form without street and house number is confirmed first;
  // an invalid one goes straight to submit, which shows the field errors.
  async function saveAfterAddressCheck() {
    if ((await form.trigger()) && !isPreciseAddress(form.getValues("customer"))) {
      setAddressConfirmVisible(true);
      return;
    }
    save();
  }

  if (loading) {
    return <LoadingView label={t("edit.loading")} />;
  }

  if (!customerId) {
    return <EmptyState message={t("edit.noCustomerMessage")} title={t("edit.noCustomerTitle")} />;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedEntrance>
          <CompactScreenHeader subtitle={hasOpenOrder ? t("edit.screenSubtitle") : t("edit.customerOnlySubtitle")} title={t("edit.screenTitle")} />
        </AnimatedEntrance>
        {error ? <AnimatedEntrance delay={60}><ErrorState message={error} /></AnimatedEntrance> : null}
        {successMessage ? <AnimatedEntrance delay={90}><SuccessState message={successMessage} /></AnimatedEntrance> : null}
        <AnimatedEntrance delay={120}>
          <FormSectionCard subtitle={t("edit.sectionSubtitle")} title={t("edit.sectionTitle")}>
            <CustomerEditForm control={form.control} errors={form.formState.errors.customer} />
            <CustomerEditAddressSection control={form.control} errors={form.formState.errors.customer} />
          </FormSectionCard>
        </AnimatedEntrance>
        {hasOpenOrder ? (
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
        ) : null}
        {canAssignDriver ? (
          <AnimatedEntrance delay={180}>
            <FormSectionCard subtitle={t("edit.driverSectionSubtitle")} title={t("edit.driverSectionTitle")}>
              <OrderDriverField
                driverId={driverId}
                drivers={drivers}
                error={driversError}
                loadingDrivers={loadingDrivers}
                onChange={setDriverId}
              />
            </FormSectionCard>
          </AnimatedEntrance>
        ) : null}
        <AnimatedEntrance delay={200} style={styles.actions}>
          <AppButton
            label={t("common:save")}
            loading={saving}
            onPress={() => void saveAfterAddressCheck()}
          />
          <AppButton label={t("edit.backButton")} onPress={() => router.back()} variant="secondary" />
        </AnimatedEntrance>
      </ScrollView>
      <AddressConfirmDialog
        onCancel={() => setAddressConfirmVisible(false)}
        onConfirm={() => {
          setAddressConfirmVisible(false);
          save();
        }}
        visible={addressConfirmVisible}
      />
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

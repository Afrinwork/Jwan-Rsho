import { useState } from "react";
import { KeyboardAvoidingView, Modal, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { FormField } from "@/src/components/forms/FormField";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { CountrySelectField } from "@/src/features/countries/components/CountrySelectField";
import { CitySelectField } from "@/src/features/customers/components/CitySelectField";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { routeT } from "@/src/features/route/i18n/routeT";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { customerRepository } from "@/src/repositories/customerRepository";
import { geocodingService } from "@/src/services/geocodingService";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";
import { formatError } from "@/src/utils/formatError";

type CustomerAddressDialogProps = {
  // The stop whose address is corrected; null = closed.
  marker: MapCustomerMarker | null;
  onClose: () => void;
  // After saving, so the map doesn't wait for the live reload.
  onSaved: () => void;
};

// Pencil next to a stop in the trip's customer list: corrects the customer's
// address mid-drive. Geocoded like a new customer's address and saved on the
// customer, so the pin, the route and every phone running the trip follow
// right away. Mounted per stop (key), so the fields start from its address.
export function CustomerAddressDialog(props: CustomerAddressDialogProps) {
  const t = routeT;
  const { t: customersT } = useTranslation("customers");
  const colors = useThemeColors();
  const [address, setAddress] = useState(props.marker?.address ?? "");
  const [country, setCountry] = useState(props.marker?.country ?? "");
  const [city, setCity] = useState(props.marker?.city ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const marker = props.marker;
    if (!marker) return;
    if (!address.trim() && !city.trim()) {
      setError(t("editAddress.missing"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const coordinates = await geocodingService.geocodeCustomerAddressSafely({ address, city, country, region: marker.region });
      if (!coordinates) {
        setError(t("editAddress.notFound"));
        return;
      }
      await customerRepository.updateAddress(marker.id, { address, city, country, ...coordinates });
      props.onSaved();
      props.onClose();
    } catch (saveError) {
      setError(formatError(saveError).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal animationType="fade" onRequestClose={props.onClose} transparent visible={props.marker !== null}>
      <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <AppText variant="subheading">{t("editAddress.title")}</AppText>
            <AppText variant="bodyMedium">{props.marker?.title}</AppText>
            <AppText color="muted" variant="caption">
              {t("editAddress.hint")}
            </AppText>
            <FormField label={customersT("form.addressLabel")}>
              <AppInput
                autoCapitalize="words"
                autoCorrect={false}
                multiline
                numberOfLines={2}
                onChangeText={setAddress}
                textAlignVertical="top"
                value={address}
              />
            </FormField>
            <View style={styles.row}>
              <View style={styles.column}>
                <CountrySelectField onChange={setCountry} value={country} />
              </View>
              <View style={styles.column}>
                <CitySelectField country={country} onChange={setCity} value={city} />
              </View>
            </View>
            {error ? <ErrorState message={error} /> : null}
            <AppButton label={t("editAddress.save")} loading={saving} onPress={() => void save()} size="compact" />
            <AppButton disabled={saving} label={t("common:cancel")} onPress={props.onClose} size="compact" variant="secondary" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.18)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    borderWidth: 1,
    borderRadius: radius.card,
    maxHeight: "90%",
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  column: {
    flex: 1,
  },
});

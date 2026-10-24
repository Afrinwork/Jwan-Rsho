import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { FormField } from "@/src/components/forms/FormField";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { CountrySelectField } from "@/src/features/countries/components/CountrySelectField";
import { CitySelectField } from "@/src/features/customers/components/CitySelectField";
import { routeT } from "@/src/features/route/i18n/routeT";
import { TripStartLocation } from "@/src/features/route/services/activeTripStorage.shared";
import { geocodeTripStartAddress, tripStartGeocodingErrorMessage } from "@/src/features/route/services/routeStartGeocodingService";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type TripStartLocationDialogProps = {
  visible: boolean;
  value: TripStartLocation | null;
  onChange: (location: TripStartLocation | null) => void;
  onClose: () => void;
};

// Where the trip starts: the GPS position (default) or an address, e.g. the
// warehouse — entered with the same address/country/city fields as a new
// order. A centered dialog rather than a bottom menu, so the keyboard never
// covers the address field.
export function TripStartLocationDialog(props: TripStartLocationDialogProps) {
  const t = routeT;
  const { t: customersT } = useTranslation("customers");
  const colors = useThemeColors();
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Opening the dialog again shows the chosen start address for editing.
  const { visible, value } = props;
  useEffect(() => {
    if (!visible) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAddress(value?.address ?? "");
    setCountry(value?.country ?? "");
    setCity(value?.city ?? "");
    setError(null);
  }, [visible, value]);

  const canSearch = Boolean(address.trim() || city.trim());

  async function search() {
    if (!canSearch) return;
    setSearching(true);
    setError(null);
    try {
      const input = { address: address.trim(), city: city.trim(), country: country.trim() };
      const location = await geocodeTripStartAddress(input);
      props.onChange({ ...input, latitude: location.latitude, longitude: location.longitude, label: location.formattedAddress });
      props.onClose();
    } catch (searchError) {
      setError(tripStartGeocodingErrorMessage(searchError));
    } finally {
      setSearching(false);
    }
  }

  return (
    <Modal animationType="fade" onRequestClose={props.onClose} transparent visible={props.visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <AppText variant="subheading">{t("startCard.title")}</AppText>
            <AppText color="muted" variant="caption">
              {props.value ? `${t("startCard.selectedLocation")}: ${props.value.label}` : t("startCard.currentLocationLabel")}
            </AppText>
            <AppButton
              label={t("startCard.useCurrentLocation")}
              onPress={() => {
                props.onChange(null);
                props.onClose();
              }}
              size="compact"
              variant={props.value ? "secondary" : "primary"}
            />
            <View style={styles.manual}>
              <AppText variant="label">{t("startCard.manualAddressTitle")}</AppText>
              <AppText color="muted" variant="caption">{t("startCard.manualAddressHint")}</AppText>
              <FormField label={customersT("form.addressLabel")}>
                <AppInput
                  autoCapitalize="words"
                  autoCorrect={false}
                  multiline
                  numberOfLines={2}
                  onChangeText={setAddress}
                  placeholder={t("startCard.locationPlaceholder")}
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
              <AppButton
                disabled={!canSearch}
                label={t("startCard.searchLocationAction")}
                loading={searching}
                onPress={() => void search()}
                size="compact"
              />
            </View>
            <AppButton label={t("common:cancel")} onPress={props.onClose} size="compact" variant="secondary" />
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
  manual: { gap: spacing.xs },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  column: {
    flex: 1,
  },
});

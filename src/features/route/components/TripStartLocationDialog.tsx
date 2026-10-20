import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
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

// Where the trip starts: the GPS position (default) or a typed address,
// e.g. the warehouse. A centered dialog rather than a bottom menu, so the
// keyboard never covers the address field.
export function TripStartLocationDialog(props: TripStartLocationDialogProps) {
  const t = routeT;
  const colors = useThemeColors();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearching(true);
    setError(null);
    try {
      const location = await geocodeTripStartAddress(trimmed);
      props.onChange({ latitude: location.latitude, longitude: location.longitude, label: location.formattedAddress });
      setQuery("");
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
            <AppInput
              autoCorrect={false}
              onChangeText={setQuery}
              onSubmitEditing={() => void search()}
              placeholder={t("startCard.locationPlaceholder")}
              returnKeyType="search"
              value={query}
            />
            {error ? <ErrorState message={error} /> : null}
            <AppButton
              disabled={!query.trim()}
              label={t("startCard.searchLocationAction")}
              loading={searching}
              onPress={() => void search()}
              size="compact"
            />
          </View>
          <AppButton label={t("common:cancel")} onPress={props.onClose} size="compact" variant="secondary" />
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
    padding: spacing.md,
    gap: spacing.sm,
  },
  manual: { gap: spacing.xs },
});

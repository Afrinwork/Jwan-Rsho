import { useCallback, useState } from "react";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";

import { driverCheckInRepository } from "@/src/repositories/driverCheckInRepository";
import { geocodingService } from "@/src/services/geocodingService";
import { formatError } from "@/src/utils/formatError";

export function useDriverLiveStatus() {
  const { t } = useTranslation("map");
  const [visible, setVisible] = useState(false);
  const [odometer, setOdometer] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const open = useCallback(() => {
    setError(null);
    setSuccess(null);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setError(null);
    setSuccess(null);
    setVisible(false);
  }, []);

  const send = useCallback(async () => {
    const parsedOdometer = Number(odometer.trim().replace(",", "."));
    if (!odometer.trim() || !Number.isFinite(parsedOdometer) || parsedOdometer < 0) {
      setError(t("driverStatus.invalidOdometer"));
      return false;
    }

    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError(t("driverStatus.locationRequired"));
        return false;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordinate = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      const place = await geocodingService.reverseGeocode(coordinate).catch(() => null);
      const address = [place?.name, place?.street, place?.postalCode, place?.city, place?.country]
        .filter((part): part is string => Boolean(part?.trim()))
        .join(", ") || `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`;

      await driverCheckInRepository.submitDailyStatus({
        address,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        accuracy: location.coords.accuracy ?? 0,
        odometerKm: parsedOdometer,
      });
      setSuccess(t("driverStatus.sentSuccess", { odometer: `${Math.round(parsedOdometer)} km` }));
      return true;
    } catch (sendError) {
      setError(formatError(sendError).message);
      return false;
    } finally {
      setSending(false);
    }
  }, [odometer, t]);

  const sendLocationUpdate = useCallback(async () => {
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError(t("driverStatus.locationRequired"));
        return false;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordinate = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      const place = await geocodingService.reverseGeocode(coordinate).catch(() => null);
      const address = [place?.name, place?.street, place?.postalCode, place?.city, place?.country]
        .filter((part): part is string => Boolean(part?.trim()))
        .join(", ") || `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`;

      await driverCheckInRepository.reportLiveStatus({
        address,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        accuracy: location.coords.accuracy ?? 0,
      });
      setSuccess(t("driverStatus.locationSentSuccess"));
      return true;
    } catch (updateError) {
      setError(formatError(updateError).message);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [t]);

  return { close, error, odometer, open, send, sendLocationUpdate, sending, setOdometer, success, updating, visible };
}

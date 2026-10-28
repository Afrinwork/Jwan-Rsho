import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { routeT } from "@/src/features/route/i18n/routeT";
import { buildTripWhatsappMessage, formatArrivalWindow } from "@/src/features/route/services/tripWhatsappService";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { whatsappService } from "@/src/services/whatsappService";
import { WhatsappApp } from "@/src/services/whatsappService.shared";
import { useAppStore } from "@/src/store/appStore";
import { formatError } from "@/src/utils/formatError";

type Chat = { name: string; phone: string; message: string };
type Sending = { app: WhatsappApp; chats: Chat[]; index: number };

// "Tell by WhatsApp" in the trip's customer list: the picked customers each
// get their own chat with their arrival time. WhatsApp lets no app send by
// itself, so one tap opens the first chat with the text typed in; once the
// person has sent it and comes back to the app, the next chat opens.
export function useTripWhatsapp(
  pendingMarkers: MapCustomerMarker[],
  etaById: Map<string, Date>,
  productEmojiById: Map<string, string | undefined>,
) {
  const language = useAppStore((state) => state.language);
  const templateDe = useAppStore((state) => state.whatsappTemplateDe);
  const templateAr = useAppStore((state) => state.whatsappTemplateAr);
  const components = useAppStore((state) => state.whatsappComponents);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [windowMinutes, setWindowMinutes] = useState(0);
  const [sending, setSending] = useState<Sending | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stops already completed drop out of the list, and out of the picks.
  const selectedIds = useMemo(() => {
    const pending = new Set(pendingMarkers.map((marker) => marker.id));
    return pickedIds.filter((id) => pending.has(id));
  }, [pendingMarkers, pickedIds]);

  const toggle = useCallback((customerId: string) => {
    setPickedIds((current) => (current.includes(customerId) ? current.filter((id) => id !== customerId) : [...current, customerId]));
  }, []);

  const arrivalLabel = useCallback(
    (customerId: string) => {
      const eta = etaById.get(customerId);
      return eta ? formatArrivalWindow(eta, windowMinutes) : undefined;
    },
    [etaById, windowMinutes],
  );

  const openChat = useCallback(async (next: Sending) => {
    const chat = next.chats[next.index];
    try {
      await whatsappService.openChat(next.app, chat.phone, chat.message);
    } catch (openError) {
      setSending(null);
      setError(formatError(openError).message);
    }
  }, []);

  // Back in the app after a chat: open the next one, or finish.
  const leftAppRef = useRef(false);
  useEffect(() => {
    if (!sending) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background") leftAppRef.current = true;
      if (state !== "active" || !leftAppRef.current) return;
      leftAppRef.current = false;
      const next = { ...sending, index: sending.index + 1 };
      if (next.index >= next.chats.length) {
        setSending(null);
        setMessage(routeT("whatsappNotify.done", { count: sending.chats.length }));
        setPickedIds([]);
        return;
      }
      setSending(next);
      void openChat(next);
    });
    return () => subscription.remove();
  }, [sending, openChat]);

  async function start(app: WhatsappApp) {
    setError(null);
    setMessage(null);
    const picked = pendingMarkers.filter((marker) => selectedIds.includes(marker.id));
    const withPhone = picked.filter((marker) => marker.phone.trim());
    const withoutPhone = picked.filter((marker) => !marker.phone.trim()).map((marker) => marker.title);
    if (withoutPhone.length) setError(routeT("whatsappNotify.noPhone", { names: withoutPhone.join(", ") }));
    if (!withPhone.length) return;

    setPreparing(true);
    try {
      const orders = await orderDetailsRepository.getOpenOrdersWithItemsByCustomerIds(withPhone.map((marker) => marker.id));
      const chats = withPhone.map((marker) => ({
        name: marker.title,
        phone: marker.phone,
        message: buildTripWhatsappMessage({
          marker,
          orders: orders.filter((order) => order.customerId === marker.id),
          productEmojiById,
          arrivalLabel: arrivalLabel(marker.id),
          template: language === "ar" ? templateAr : templateDe,
          components,
          language: language === "ar" ? "ar" : "de",
        }),
      }));
      const first = { app, chats, index: 0 };
      leftAppRef.current = false;
      setSending(first);
      await openChat(first);
    } catch (loadError) {
      setError(formatError(loadError).message);
    } finally {
      setPreparing(false);
    }
  }

  return {
    selectedIds,
    toggle,
    windowMinutes,
    setWindowMinutes,
    arrivalLabel,
    start,
    stop: () => setSending(null),
    preparing,
    progress: sending ? { current: sending.index + 1, total: sending.chats.length, name: sending.chats[sending.index].name } : null,
    message,
    error,
  };
}

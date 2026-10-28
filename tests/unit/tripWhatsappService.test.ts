import test from "node:test";
import assert from "node:assert/strict";

import { buildTripWhatsappMessage, formatArrivalWindow } from "@/src/features/route/services/tripWhatsappService";
import { buildWhatsappSendUrl, toWhatsappDigits } from "@/src/services/phoneService.shared";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";

const eta = new Date(2026, 9, 28, 4, 17);

test("without a window the arrival stays an estimate", () => {
  assert.equal(formatArrivalWindow(eta, 0), "~04:17");
});

test("a window shows from-to", () => {
  assert.equal(formatArrivalWindow(eta, 30), "04:17–04:47");
  assert.equal(formatArrivalWindow(eta, 120), "04:17–06:17");
});

test("the trip message uses the settings text and always carries the arrival time", () => {
  const marker = { id: "c1", title: "Abu Sia", description: "Meller Str. 215", phone: "0176 1", city: "Osnabrück" } as MapCustomerMarker;
  const message = buildTripWhatsappMessage({
    marker,
    orders: [],
    productEmojiById: new Map(),
    arrivalLabel: "04:17–04:47",
    template: "Hallo, wir kommen heute:",
    components: ["name", "thankYou"],
    language: "de",
  });

  assert.ok(message.startsWith("Hallo, wir kommen heute:"));
  assert.match(message, /Name: Abu Sia\nUngefaehre Ankunft: 04:17–04:47/);
});

test("WhatsApp numbers are international, German local numbers get 49", () => {
  assert.equal(toWhatsappDigits("0176 123 456"), "49176123456");
  assert.equal(toWhatsappDigits("+49 176 123"), "49176123");
  assert.equal(toWhatsappDigits("0049 176 123"), "49176123");
  assert.equal(toWhatsappDigits("+963 9 123"), "9639123");
});

test("the send link opens the chat with the text filled in", () => {
  assert.equal(buildWhatsappSendUrl("0176 1", "Hi & bye"), "whatsapp://send?phone=491761&text=Hi%20%26%20bye");
});

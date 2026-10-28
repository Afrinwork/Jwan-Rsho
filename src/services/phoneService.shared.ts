function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/[^\d+]/g, "");
}

export function buildPhoneUrl(phoneNumber: string) {
  const normalized = normalizePhoneNumber(phoneNumber);

  if (!normalized || normalized.length < 3) {
    throw new Error("Keine gueltige Telefonnummer vorhanden.");
  }

  return `tel:${normalized}`;
}

// WhatsApp needs the international number without "+" or "00". Numbers
// saved the German way ("0176 …") get the German country code.
export function toWhatsappDigits(phoneNumber: string) {
  const digits = normalizePhoneNumber(phoneNumber).replace(/^\+/, "").replace(/^00/, "");
  return /^0\d/.test(digits) ? `49${digits.slice(1)}` : digits;
}

// Opens the chat with the text already typed in — sending stays with the
// person (WhatsApp lets no app send on its own).
export function buildWhatsappSendUrl(phoneNumber: string, text: string) {
  const digitsOnly = toWhatsappDigits(phoneNumber);

  if (!digitsOnly || digitsOnly.length < 3) {
    throw new Error("Keine gueltige Telefonnummer vorhanden.");
  }

  return `whatsapp://send?phone=${digitsOnly}&text=${encodeURIComponent(text)}`;
}

export function buildWhatsappUrl(phoneNumber: string) {
  const digitsOnly = toWhatsappDigits(phoneNumber);

  if (!digitsOnly || digitsOnly.length < 3) {
    throw new Error("Keine gueltige Telefonnummer vorhanden.");
  }

  return `https://wa.me/${digitsOnly}`;
}

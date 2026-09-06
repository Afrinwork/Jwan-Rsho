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

export function buildWhatsappUrl(phoneNumber: string) {
  const digitsOnly = normalizePhoneNumber(phoneNumber).replace(/^\+/, "");

  if (!digitsOnly || digitsOnly.length < 3) {
    throw new Error("Keine gueltige Telefonnummer vorhanden.");
  }

  return `https://wa.me/${digitsOnly}`;
}

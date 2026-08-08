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

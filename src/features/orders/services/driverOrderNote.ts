// Stamped onto every order a driver creates from the Add screen, so the
// admin/super_admin can tell it apart from their own orders wherever
// orders are listed. Bilingual on purpose: it's stored once, at creation,
// and read later by an owner whose app language may differ from the
// driver's.
const DRIVER_NOTE_PREFIX = "🚚 Vom Fahrer hinzugefügt";

// Reads the note back: which driver created this order (null = not a
// driver-created order). Lets the owner's map point out new driver orders.
export function driverNameFromOrderNote(note: string | null | undefined): string | null {
  if (!note?.startsWith(DRIVER_NOTE_PREFIX)) return null;
  const separator = note.lastIndexOf(": ");
  return separator === -1 ? "" : note.slice(separator + 2).trim();
}

export function buildDriverOrderNote(driverName: string | null | undefined) {
  const name = driverName?.trim();
  return name ? `🚚 Vom Fahrer hinzugefügt / أضافه السائق: ${name}` : "🚚 Vom Fahrer hinzugefügt / أضافه السائق";
}

// A typed quantity: "1,5", "1.5", "1," (still typing) -> number; "" -> 0;
// anything that isn't a non-negative number -> null (leave the value as is).
export function parseDecimalInput(text: string): number | null {
  const cleaned = text.trim().replace(",", ".");
  if (cleaned === "") return 0;
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === ".") return null;
  return Number(cleaned);
}

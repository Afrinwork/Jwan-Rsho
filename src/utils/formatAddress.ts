export function formatAddress(parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(", ");
}

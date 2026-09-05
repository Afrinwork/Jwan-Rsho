// mailto: (RFC 6068) requires percent-encoding of reserved characters, with
// spaces as %20 — NOT "+". URLSearchParams encodes as
// application/x-www-form-urlencoded (spaces -> "+"), which some mail clients
// then show as a literal "+" instead of decoding it back to a space. Building
// the query string by hand with encodeURIComponent avoids that.
export function buildMailtoUrl(subject: string, body: string) {
  const normalizedBody = body.trim();

  if (!normalizedBody) {
    throw new Error("Keine Nachricht zum Versenden per E-Mail vorhanden.");
  }

  const parts: string[] = [];

  if (subject.trim()) {
    parts.push(`subject=${encodeURIComponent(subject.trim())}`);
  }

  parts.push(`body=${encodeURIComponent(normalizedBody)}`);

  return `mailto:?${parts.join("&")}`;
}

export function buildMailtoUrl(subject: string, body: string) {
  const normalizedBody = body.trim();

  if (!normalizedBody) {
    throw new Error("Keine Nachricht zum Versenden per E-Mail vorhanden.");
  }

  const params = new URLSearchParams();

  if (subject.trim()) {
    params.set("subject", subject.trim());
  }

  params.set("body", normalizedBody);

  return `mailto:?${params.toString()}`;
}

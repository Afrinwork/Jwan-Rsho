import test from "node:test";
import assert from "node:assert/strict";

import { buildMailtoUrl } from "@/src/services/emailService.shared";

test("mailto url includes subject and same message body", () => {
  const url = buildMailtoUrl("Kundenauswahl", "Hallo\nDies ist die gleiche Nachricht.");

  assert.match(url, /^mailto:\?/);
  assert.match(url, /subject=Kundenauswahl/);
  assert.match(url, /body=Hallo/);
  assert.match(url, /%0A/);
});

test("spaces are percent-encoded as %20, never a literal '+' (some mail clients don't decode '+' back to a space)", () => {
  const url = buildMailtoUrl("Kunden Auswahl", "Zwei Woerter");

  assert.match(url, /subject=Kunden%20Auswahl/);
  assert.match(url, /body=Zwei%20Woerter/);
  assert.doesNotMatch(url, /\+/);
});

test("empty email body raises a friendly error", () => {
  assert.throws(() => buildMailtoUrl("Kundenauswahl", "   "), /Keine Nachricht zum Versenden per E-Mail vorhanden/);
});

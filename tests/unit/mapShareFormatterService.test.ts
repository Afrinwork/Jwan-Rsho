import test from "node:test";
import assert from "node:assert/strict";

import { buildSelectionShareMessage } from "@/src/features/map/services/mapShareFormatterService";

test("share message contains name, address, order, and thank-you without shop name", () => {
  const message = buildSelectionShareMessage(
    [
      {
        fullName: "Ahmad Ali",
        address: "Musterstrasse 12",
        phone: "111",
        city: "Hamburg",
        items: [
          { productName: "Kaese", quantity: 2, unit: "kg" },
          { productName: "Labneh", quantity: 1, unit: "kg" },
        ],
      },
    ],
    [{ productName: "Kaese", quantity: 2, unit: "kg" }],
    { includeTotal: true, shopName: "Rsho Kaeserei" },
  );

  assert.equal(
    message,
    [
      "Name: Ahmad Ali",
      "Adresse: Musterstrasse 12, Hamburg",
      "",
      "Bestellung:",
      "Kaese: 2 kg",
      "Labneh: 1 kg",
      "",
      "Danke fuer Ihre Bestellung.",
    ].join("\n"),
  );
  assert.equal(message.includes("Rsho Kaeserei"), false);
  assert.equal(message.includes("Gesamt"), false);
});

test("multiple customers are separated but each block keeps the same simple format", () => {
  const message = buildSelectionShareMessage(
    [
      {
        fullName: "Ahmad Ali",
        address: "Musterstrasse 12",
        phone: "111",
        city: "Hamburg",
        items: [{ productName: "Kaese", quantity: 2, unit: "kg" }],
      },
      {
        fullName: "Sara Ali",
        address: "Hauptstrasse 8",
        phone: "222",
        city: "Berlin",
        items: [{ productName: "Oliven", quantity: 3, unit: "kg" }],
      },
    ],
    [],
  );

  assert.ok(message.includes("Name: Ahmad Ali\nAdresse: Musterstrasse 12, Hamburg\n\n"));
  assert.ok(message.includes("--------------"));
  assert.ok(message.includes("Name: Sara Ali\nAdresse: Hauptstrasse 8, Berlin\n\n"));
  assert.equal(message.split("Danke fuer Ihre Bestellung.").length - 1, 2);
});

test("address can be omitted and empty order still produces a useful message", () => {
  const message = buildSelectionShareMessage(
    [{ fullName: "Amina", address: "", phone: "", city: "", items: [] }],
    [],
    { includeAddress: false },
  );

  assert.equal(
    message,
    [
      "Name: Amina",
      "",
      "Bestellung:",
      "Keine offene Bestellung",
      "",
      "Danke fuer Ihre Bestellung.",
    ].join("\n"),
  );
});

test("empty selection returns an empty message and never crashes", () => {
  assert.equal(buildSelectionShareMessage([], []), "");
});

test("WhatsApp template replaces customer and order placeholders", () => {
  const message = buildSelectionShareMessage(
    [
      { fullName: "Ahmad Ali", address: "", phone: "", city: "", orderCount: 2, items: [] },
      { fullName: "Sara Ali", address: "", phone: "", city: "", orderCount: 1, items: [] },
    ],
    [],
    { messageTemplate: "Tour: {{kunden}} Kunden, {{bestellungen}} Bestellungen" },
  );

  assert.ok(message.startsWith("Tour: 2 Kunden, 3 Bestellungen\n\n--------------\n\nName: Ahmad Ali"));
});

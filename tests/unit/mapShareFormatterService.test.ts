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

test("WhatsApp template text is prepended as-is, with no placeholder substitution", () => {
  const message = buildSelectionShareMessage(
    [
      { fullName: "Ahmad Ali", address: "", phone: "", city: "", orderCount: 2, items: [] },
      { fullName: "Sara Ali", address: "", phone: "", city: "", orderCount: 1, items: [] },
    ],
    [],
    { messageTemplate: "Hallo, hier ist die Auswahl:" },
  );

  assert.ok(message.startsWith("Hallo, hier ist die Auswahl:\n\n--------------\n\nName: Ahmad Ali"));
});

test("components are rendered in the chosen order, not a fixed one", () => {
  const customer = {
    fullName: "Anna",
    address: "Hauptstr 1",
    phone: "0151",
    city: "Berlin",
    items: [{ productName: "Käse", quantity: 2, unit: "kg" }],
  };
  const message = buildSelectionShareMessage([customer], [], { components: ["orders", "name", "phone"] });
  assert.equal(message, ["Bestellung:", "Käse: 2 kg", "Name: Anna", "Telefon: 0151"].join("\n"));
});

test("multi-line blocks get a blank line before them unless they open the block", () => {
  const customer = { fullName: "Anna", address: "", phone: "", city: "", items: [] };
  const message = buildSelectionShareMessage([customer], [], { components: ["thankYou", "name", "orders"] });
  assert.equal(message, ["Danke fuer Ihre Bestellung.", "Name: Anna", "", "Bestellung:", "Keine offene Bestellung"].join("\n"));
});

test("an Arabic message uses Arabic labels throughout", () => {
  const customer = { fullName: "أحمد", address: "", phone: "0151", city: "برلين", items: [{ productName: "جبنة", quantity: 2, unit: "kg" }] };
  const message = buildSelectionShareMessage([customer], [], { components: ["name", "address", "phone", "orders", "thankYou"], language: "ar" });
  assert.equal(message, ["الاسم: أحمد", "العنوان: برلين", "الهاتف: 0151", "", "الطلب:", "جبنة: 2 kg", "", "شكراً لطلبكم."].join("\n"));
  assert.doesNotMatch(message, /Name|Adresse|Telefon|Bestellung|Danke/);
});

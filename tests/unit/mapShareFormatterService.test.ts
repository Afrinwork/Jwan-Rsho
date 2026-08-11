import test from "node:test";
import assert from "node:assert/strict";

import { buildSelectionShareMessage } from "@/src/features/map/services/mapShareFormatterService";

const SEPARATOR = "━━━━━━━━━━━━━━";

test("share message uses the emoji template: header, numbered customers, totals, footer", () => {
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
      {
        fullName: "Sara Ali",
        address: "Hauptstrasse 8",
        phone: "222",
        city: "Hamburg",
        items: [{ productName: "Oliven", quantity: 3, unit: "kg" }],
      },
    ],
    [
      { productName: "Kaese", quantity: 2, unit: "kg" },
      { productName: "Labneh", quantity: 1, unit: "kg" },
      { productName: "Oliven", quantity: 3, unit: "kg" },
    ],
  );

  assert.equal(
    message,
    [
      "📍 Hamburg",
      "📦 Anzahl Bestellungen: 2",
      "",
      SEPARATOR,
      "",
      "1️⃣ Ahmad Ali",
      "📍 Musterstrasse 12, Hamburg",
      "",
      "📦 Kaese: 2 kg",
      "📦 Labneh: 1 kg",
      "",
      SEPARATOR,
      "",
      "2️⃣ Sara Ali",
      "📍 Hauptstrasse 8, Hamburg",
      "",
      "📦 Oliven: 3 kg",
      "",
      SEPARATOR,
      "",
      "📊 Gesamt",
      "",
      "📦 Kaese: 2 kg",
      "📦 Labneh: 1 kg",
      "📦 Oliven: 3 kg",
      "",
      SEPARATOR,
      "",
      "👥 Anzahl Kunden: 2",
      "📦 Bestellungen insgesamt: 2",
    ].join("\n"),
  );
});

test("shop name appears in the header and footer when set", () => {
  const message = buildSelectionShareMessage(
    [{ fullName: "Ahmad Ali", address: "Musterstrasse 12", phone: "111", city: "Hamburg", items: [] }],
    [],
    { includeTotal: false, shopName: "🧀 Rsho Kaeserei" },
  );

  assert.ok(message.startsWith("🧀 Rsho Kaeserei\n📍 Hamburg"));
  assert.ok(message.endsWith("🧀 Rsho Kaeserei"));
});

test("per-product emoji is used when a product has one, otherwise a default emoji is used", () => {
  const message = buildSelectionShareMessage(
    [
      {
        fullName: "Ahmad Ali",
        address: "Musterstrasse 12",
        phone: "111",
        city: "Hamburg",
        items: [
          { productName: "Kaese", quantity: 2, unit: "kg", emoji: "🧀" },
          { productName: "Labneh", quantity: 1, unit: "kg" },
        ],
      },
    ],
    [],
    { includeTotal: false },
  );

  assert.ok(message.includes("🧀 Kaese: 2 kg"));
  assert.ok(message.includes("📦 Labneh: 1 kg"));
});

test("customer note is appended when present, omitted otherwise", () => {
  const withNote = buildSelectionShareMessage(
    [{ fullName: "Ahmad Ali", address: "Musterstrasse 12", phone: "111", city: "Hamburg", note: "Nach 17 Uhr", items: [] }],
    [],
    { includeTotal: false },
  );
  const withoutNote = buildSelectionShareMessage(
    [{ fullName: "Sara Ali", address: "Hauptstrasse 8", phone: "222", city: "Hamburg", items: [] }],
    [],
    { includeTotal: false },
  );

  assert.ok(withNote.includes("📝 Notiz: Nach 17 Uhr"));
  assert.ok(!withoutNote.includes("📝 Notiz"));
});

test("order count is shown when a customer has more than one order, omitted for exactly one", () => {
  const multipleOrders = buildSelectionShareMessage(
    [{ fullName: "Ahmad Ali", address: "Musterstrasse 12", phone: "111", city: "Hamburg", orderCount: 3, items: [] }],
    [],
    { includeTotal: false },
  );
  const singleOrder = buildSelectionShareMessage(
    [{ fullName: "Sara Ali", address: "Hauptstrasse 8", phone: "222", city: "Hamburg", orderCount: 1, items: [] }],
    [],
    { includeTotal: false },
  );

  assert.ok(multipleOrders.includes("🧾 3 Bestellungen"));
  assert.ok(!singleOrder.includes("🧾"));
});

test("order counts in header and footer sum every customer's orders, not just the customer count", () => {
  const message = buildSelectionShareMessage(
    [
      { fullName: "Ahmad Ali", address: "A", phone: "111", city: "Hamburg", orderCount: 3, items: [] },
      { fullName: "Sara Ali", address: "B", phone: "222", city: "Hamburg", orderCount: 1, items: [] },
      { fullName: "Nadia", address: "C", phone: "333", city: "Hamburg", orderCount: 2, items: [] },
      { fullName: "Zara", address: "D", phone: "444", city: "Hamburg", orderCount: 1, items: [] },
      { fullName: "Amina", address: "E", phone: "555", city: "Hamburg", orderCount: 1, items: [] },
    ],
    [],
    { includeTotal: false },
  );

  assert.ok(message.includes("📦 Anzahl Bestellungen: 8"));
  assert.ok(message.includes("👥 Anzahl Kunden: 5"));
  assert.ok(message.includes("📦 Bestellungen insgesamt: 8"));
});

test("phone is only included when requested", () => {
  const message = buildSelectionShareMessage(
    [{ fullName: "Ahmad Ali", address: "Musterstrasse 12", phone: "111", city: "Hamburg", items: [] }],
    [],
    { includePhone: true, includeTotal: false },
  );

  assert.ok(message.includes("📞 111"));
});

test("multiple cities fall back to a generic header instead of one wrong city", () => {
  const message = buildSelectionShareMessage(
    [
      { fullName: "Ahmad Ali", address: "A", phone: "111", city: "Hamburg", items: [] },
      { fullName: "Sara Ali", address: "B", phone: "222", city: "Berlin", items: [] },
    ],
    [],
    { includeTotal: false },
  );

  assert.ok(message.startsWith("📍 Mehrere Staedte"));
});

test("empty selection returns an empty message and never crashes", () => {
  assert.equal(buildSelectionShareMessage([], []), "");
});

test("share message omits empty address and phone values without undefined text", () => {
  const message = buildSelectionShareMessage(
    [{ fullName: "Amina", address: "", phone: "", city: "", items: [] }],
    [],
    { includeAddress: true, includePhone: true, includeTotal: false },
  );

  assert.equal(message.includes("undefined"), false);
  assert.equal(message.includes("null"), false);
});

import test from "node:test";
import assert from "node:assert/strict";

import { buildSelectionShareMessage } from "@/src/features/map/services/mapShareFormatterService";

// mapT (used inside the formatter) is fixed to Arabic regardless of the
// app's active locale (see src/features/map/i18n/mapT.ts), so the labels
// below must match src/i18n/locales/ar/map.json, not the German file.
const SEPARATOR = "━━━━━━━━━━━━━━";

test("share message: header, then per customer address -> name -> order block, then totals, footer", () => {
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
      "📦 عدد الطلبات: 2",
      "",
      SEPARATOR,
      "",
      "Musterstrasse 12, Hamburg",
      "",
      "Ahmad Ali",
      "الطلبية",
      "Kaese: 2 kg",
      "Labneh: 1 kg",
      "",
      SEPARATOR,
      "",
      "Hauptstrasse 8, Hamburg",
      "",
      "Sara Ali",
      "الطلبية",
      "Oliven: 3 kg",
      "",
      SEPARATOR,
      "",
      "📊 المجموع",
      "",
      "Kaese: 2 kg",
      "Labneh: 1 kg",
      "Oliven: 3 kg",
      "",
      SEPARATOR,
      "",
      "👥 عدد الزبائن: 2",
      "📦 إجمالي الطلبات: 2",
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

test("per-product emoji is used when a product has one, otherwise no emoji prefix at all", () => {
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
  // Exactly this line, not just "somewhere in the message" — the header/
  // footer legitimately use 📦 for the order count, unrelated to items.
  assert.ok(message.includes("\nLabneh: 1 kg\n"));
  assert.ok(!message.includes("📦 Labneh"));
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

  assert.ok(withNote.includes("ملاحظة: Nach 17 Uhr"));
  assert.ok(!withoutNote.includes("ملاحظة"));
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

  assert.ok(multipleOrders.includes("3 طلبات"));
  assert.ok(!singleOrder.includes("1 طلبات"));
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

  assert.ok(message.includes("📦 عدد الطلبات: 8"));
  assert.ok(message.includes("👥 عدد الزبائن: 5"));
  assert.ok(message.includes("📦 إجمالي الطلبات: 8"));
});

test("phone is only included when requested, without an emoji prefix", () => {
  const message = buildSelectionShareMessage(
    [{ fullName: "Ahmad Ali", address: "Musterstrasse 12", phone: "111", city: "Hamburg", items: [] }],
    [],
    { includePhone: true, includeTotal: false },
  );

  assert.ok(message.includes("\n111\n"));
  assert.ok(!message.includes("📞"));
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

  assert.ok(message.startsWith("📍 عدة مدن"));
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

test("name and order block form one contiguous chunk directly below the address, for easy copying", () => {
  const message = buildSelectionShareMessage(
    [
      {
        fullName: "Abdullah Sheikho",
        address: "Osterfelder Str. 28-30",
        phone: "",
        city: "Bottrop",
        items: [{ productName: "Jibne Baladi", quantity: 10, unit: "kg" }],
      },
    ],
    [],
    { includeTotal: false },
  );

  const lines = message.split("\n");
  const nameIndex = lines.indexOf("Abdullah Sheikho");
  assert.ok(nameIndex > 0, "name line should be present");
  assert.equal(lines[nameIndex - 1], "", "a blank line separates the address block from the name");
  assert.equal(lines[nameIndex + 1], "الطلبية");
  assert.equal(lines[nameIndex + 2], "Jibne Baladi: 10 kg");
  assert.ok(lines.indexOf("Osterfelder Str. 28-30, Bottrop") < nameIndex, "address comes before the name");
});

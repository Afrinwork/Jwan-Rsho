import test from "node:test";
import assert from "node:assert/strict";

import { buildSelectionShareMessage } from "@/src/features/map/services/mapShareFormatterService";

test("share message groups by city, numbers customers and appends totals", () => {
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
      { productKey: "p1:kg", productName: "Kaese", quantity: 2, unit: "kg" },
      { productKey: "p2:kg", productName: "Labneh", quantity: 1, unit: "kg" },
      { productKey: "p3:kg", productName: "Oliven", quantity: 3, unit: "kg" },
    ],
  );

  assert.equal(
    message,
    [
      "Hamburg",
      "",
      "1. Ahmad Ali",
      "   Musterstrasse 12",
      "",
      "- Kaese: 2 kg",
      "- Labneh: 1 kg",
      "",
      "2. Sara Ali",
      "   Hauptstrasse 8",
      "",
      "- Oliven: 3 kg",
      "",
      "Gesamt:",
      "",
      "- Kaese: 2 kg",
      "- Labneh: 1 kg",
      "- Oliven: 3 kg",
    ].join("\n"),
  );
});

test("phone is only included when requested", () => {
  const message = buildSelectionShareMessage(
    [{ fullName: "Ahmad Ali", address: "Musterstrasse 12", phone: "111", city: "Hamburg", items: [] }],
    [],
    { includePhone: true, includeTotal: false },
  );

  assert.equal(message, ["Hamburg", "", "1. Ahmad Ali", "   Musterstrasse 12", "   111", "", "Keine offene Bestellung"].join("\n"));
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

  assert.equal(message, ["Ohne Stadt", "", "1. Amina", "", "Keine offene Bestellung"].join("\n"));
  assert.equal(message.includes("undefined"), false);
  assert.equal(message.includes("null"), false);
});

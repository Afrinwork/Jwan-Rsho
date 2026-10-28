import test from "node:test";
import assert from "node:assert/strict";

import { isPreciseAddress, NO_STREET_NOTE, withAddressNote } from "@/src/features/customers/services/addressNote";

test("a customer without a street gets the address note", () => {
  assert.equal(withAddressNote({ address: "", city: "Gotha", note: "" }).note, NO_STREET_NOTE);
});

test("the city typed again as street counts as no street", () => {
  assert.equal(withAddressNote({ address: "  GOTHA ", city: "Gotha" }).note, NO_STREET_NOTE);
});

test("an existing note is kept below the address note", () => {
  assert.equal(withAddressNote({ address: "", city: "Gotha", note: "Ruft vorher an" }).note, `${NO_STREET_NOTE}\nRuft vorher an`);
});

test("saving again does not add the address note twice", () => {
  const once = withAddressNote({ address: "", city: "Gotha", note: "Ruft vorher an" });
  assert.equal(withAddressNote(once).note, once.note);
});

test("the address note is removed once a street is entered", () => {
  const note = `${NO_STREET_NOTE}\nRuft vorher an`;
  assert.equal(withAddressNote({ address: "Hauptstr. 5", city: "Gotha", note }).note, "Ruft vorher an");
});

test("a precise address needs a street and a house number", () => {
  assert.equal(isPreciseAddress({ address: "Hauptstraße 5", city: "Gotha" }), true);
  assert.equal(isPreciseAddress({ address: "Hauptstr. 5, 99867 Gotha", city: "Gotha" }), true);
  assert.equal(isPreciseAddress({ address: "Hauptstraße", city: "Gotha" }), false);
  assert.equal(isPreciseAddress({ address: "99867", city: "Gotha" }), false);
  assert.equal(isPreciseAddress({ address: "", city: "Gotha" }), false);
  assert.equal(isPreciseAddress({ address: "Gotha", city: "Gotha" }), false);
});

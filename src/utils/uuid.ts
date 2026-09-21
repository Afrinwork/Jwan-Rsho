// crypto.randomUUID() is not reliably available in React Native's Hermes
// JS engine -- unlike Node.js, where every test script in this project
// runs (and where it worked fine, masking this). Self-contained UUID v4
// generator instead of adding a native dependency (e.g. expo-crypto),
// which would need a prebuild + new dev client before it could even be
// tested. Not cryptographically secure -- fine here, these are only
// unique row ids and idempotency tokens, never security-sensitive
// values (auth tokens, passwords, ...).
export function generateUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

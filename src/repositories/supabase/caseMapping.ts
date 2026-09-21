// Generic camelCase <-> snake_case object-key conversion, used by every
// Supabase repository to bridge the app's existing camelCase domain types
// (Customer, Order, ...) and Postgres's snake_case column names, instead
// of hand-mapping every field per table (error-prone, easy to typo/drift).
// Only handles flat/shallow objects -- none of this app's rows nest
// objects, so a deep recursive version isn't needed.

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
}

export function toSnakeCase<T extends object>(value: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [camelToSnake(k), v]),
  );
}

// Postgres always returns a nullable column as an explicit `null`; Firestore
// simply omits a field that was never set, so the app's existing domain
// types (Customer.region?: string, etc.) and every component that reads
// them were written assuming "absent" (undefined), never "present but
// null". Stripping null keys here -- rather than auditing every
// `value.optionalField.something` call site across the app -- restores
// that exact Firestore shape. None of this app's optional fields ever
// used null as a meaningful third state distinct from "not set".
export function toCamelCase<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(row)
      .filter(([, v]) => v !== null)
      .map(([k, v]) => [snakeToCamel(k), v]),
  ) as T;
}

// Supabase's generated RPC arg types require the Json type for jsonb
// params, which plain Record<string, unknown> doesn't structurally
// satisfy (unknown isn't assignable to Json). The values here are always
// plain JSON-serializable objects/arrays built by toSnakeCase(), so this
// is a type-level bridge, not a runtime transformation.
export function toJson(value: unknown) {
  return value as never;
}

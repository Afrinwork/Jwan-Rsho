export function findMissingByName<T extends { name: string }>(seedItems: readonly T[], existingNames: string[]): T[] {
  const existing = new Set(existingNames.map((value) => value.trim().toLowerCase()));
  return seedItems.filter((item) => !existing.has(item.name.trim().toLowerCase()));
}

export function getLocalizedName(entity: { name: string; nameAr?: string }, language: string) {
  if (language === "ar" && entity.nameAr?.trim()) {
    return entity.nameAr;
  }

  return entity.name;
}

import { i18next } from "@/src/i18n/i18n";

// Passing null keeps this tracking the app's current language instead of
// pinning it to whatever language was active when the module first loaded.
export const routeT = i18next.getFixedT(null, "route");

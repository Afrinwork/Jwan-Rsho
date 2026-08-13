import { i18next } from "@/src/i18n/i18n";

/**
 * The Map screen intentionally stays German + LTR regardless of the app's
 * global language, so it uses a translator permanently pinned to "de"
 * instead of the reactive useTranslation("map") hook.
 */
export const mapT = i18next.getFixedT("de", "map");

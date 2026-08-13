import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import deMap from "@/src/i18n/locales/de/map.json";

import arAdmin from "@/src/i18n/locales/ar/admin.json";
import arAuth from "@/src/i18n/locales/ar/auth.json";
import arCities from "@/src/i18n/locales/ar/cities.json";
import arCommon from "@/src/i18n/locales/ar/common.json";
import arCountries from "@/src/i18n/locales/ar/countries.json";
import arCustomers from "@/src/i18n/locales/ar/customers.json";
import arErrors from "@/src/i18n/locales/ar/errors.json";
import arManagement from "@/src/i18n/locales/ar/management.json";
import arMap from "@/src/i18n/locales/ar/map.json";
import arNavigation from "@/src/i18n/locales/ar/navigation.json";
import arOrders from "@/src/i18n/locales/ar/orders.json";
import arOverview from "@/src/i18n/locales/ar/overview.json";
import arProducts from "@/src/i18n/locales/ar/products.json";
import arRegions from "@/src/i18n/locales/ar/regions.json";
import arSettings from "@/src/i18n/locales/ar/settings.json";
import arValidation from "@/src/i18n/locales/ar/validation.json";

/**
 * The app is Arabic-only (RTL) everywhere except the Map screen, which
 * intentionally stays German + LTR (see src/features/map/i18n/mapT.ts).
 * German resources are therefore only bundled for the "map" namespace.
 */
const resources = {
  de: {
    map: deMap,
  },
  ar: {
    common: arCommon,
    errors: arErrors,
    navigation: arNavigation,
    validation: arValidation,
    settings: arSettings,
    admin: arAdmin,
    auth: arAuth,
    cities: arCities,
    countries: arCountries,
    customers: arCustomers,
    management: arManagement,
    map: arMap,
    orders: arOrders,
    overview: arOverview,
    products: arProducts,
    regions: arRegions,
  },
};

if (!i18next.isInitialized) {
  void i18next
    .use(initReactI18next)
    .init({
      resources,
      lng: "ar",
      fallbackLng: "ar",
      defaultNS: "common",
      ns: Object.keys(resources.ar),
      interpolation: { escapeValue: false },
      returnNull: false,
      initAsync: false,
      parseMissingKeyHandler:
        process.env.NODE_ENV !== "production"
          ? (key) => `⁉MISSING:${key}⁉`
          : undefined,
    });
}

export { i18next };
export const t = i18next.t.bind(i18next);

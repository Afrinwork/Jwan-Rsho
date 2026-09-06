import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import deAdmin from "@/src/i18n/locales/de/admin.json";
import deAuth from "@/src/i18n/locales/de/auth.json";
import deCities from "@/src/i18n/locales/de/cities.json";
import deCommon from "@/src/i18n/locales/de/common.json";
import deCountries from "@/src/i18n/locales/de/countries.json";
import deCustomers from "@/src/i18n/locales/de/customers.json";
import deErrors from "@/src/i18n/locales/de/errors.json";
import deManagement from "@/src/i18n/locales/de/management.json";
import deMap from "@/src/i18n/locales/de/map.json";
import deNavigation from "@/src/i18n/locales/de/navigation.json";
import deOrders from "@/src/i18n/locales/de/orders.json";
import deOverview from "@/src/i18n/locales/de/overview.json";
import deProducts from "@/src/i18n/locales/de/products.json";
import deRegions from "@/src/i18n/locales/de/regions.json";
import deRoute from "@/src/i18n/locales/de/route.json";
import deSettings from "@/src/i18n/locales/de/settings.json";
import deValidation from "@/src/i18n/locales/de/validation.json";

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
import arRoute from "@/src/i18n/locales/ar/route.json";
import arSettings from "@/src/i18n/locales/ar/settings.json";
import arValidation from "@/src/i18n/locales/ar/validation.json";

const resources = {
  de: {
    common: deCommon,
    errors: deErrors,
    navigation: deNavigation,
    validation: deValidation,
    settings: deSettings,
    admin: deAdmin,
    auth: deAuth,
    cities: deCities,
    countries: deCountries,
    customers: deCustomers,
    management: deManagement,
    map: deMap,
    orders: deOrders,
    overview: deOverview,
    products: deProducts,
    regions: deRegions,
    route: deRoute,
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
    route: arRoute,
  },
};

const i18next = createInstance();

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
          ? (key) => `MISSING:${key}`
          : undefined,
    });
}

export { i18next };
export const t = i18next.t.bind(i18next);

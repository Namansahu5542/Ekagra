import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./locales";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false,
    compatibilityJSON: "v4",
  });
}

export default i18n;

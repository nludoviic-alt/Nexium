import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Language, type TranslationKeys } from "../i18n/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "nexium_language_pref";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored === "fr" || stored === "en") return stored;
      // Auto-detect browser language if English
      if (navigator.language?.toLowerCase().startsWith("en")) {
        return "en";
      }
    }
    return "fr";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "fr" ? "en" : "fr");
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
    toggleLanguage,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if used outside provider during SSR/testing
    return {
      language: "fr" as Language,
      setLanguage: () => {},
      t: translations.fr,
      toggleLanguage: () => {},
    };
  }
  return context;
}

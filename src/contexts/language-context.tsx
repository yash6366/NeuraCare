
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translationsData, supportedLanguagesList, defaultLanguage, type TranslationSet } from '@/lib/translations';

export type LanguageCode = 
  | 'en-US' // English (US)
  | 'hi-IN' // Hindi (India)
  | 'kn-IN' // Kannada (India)
  | 'te-IN' // Telugu (India)
  | 'ta-IN' // Tamil (India)
  | 'bn-IN' // Bengali (India)
  | 'mr-IN' // Marathi (India)
  | 'gu-IN' // Gujarati (India)
  | 'ur-IN'; // Urdu (India)

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  translate: (key: string, fallback?: string) => string;
  supportedLanguages: Array<{ value: LanguageCode; label: string; nativeLabel?: string }>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>(defaultLanguage);

  useEffect(() => {
    const storedLang = localStorage.getItem('smartcare_language') as LanguageCode | null;
    if (storedLang && supportedLanguagesList.some(l => l.value === storedLang)) {
      setLanguageState(storedLang);
    }
    // Set HTML lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('smartcare_language', lang);
    document.documentElement.lang = lang; // Update HTML lang attribute on change
  }, []);

  const translate = useCallback((key: string, fallback?: string): string => {
    const langTranslations: TranslationSet | undefined = translationsData[language];
    const defaultLangTranslations: TranslationSet = translationsData[defaultLanguage];
    
    if (langTranslations && key in langTranslations) {
      return langTranslations[key];
    }
    if (defaultLangTranslations && key in defaultLangTranslations) {
      return defaultLangTranslations[key];
    }
    return fallback || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate, supportedLanguages: supportedLanguagesList }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

    
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { en } from '@/locales/en';
import { ar } from '@/locales/ar';

type Language = 'ar' | 'en';
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, any>) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = { en, ar };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('pos_language');
    return (saved as Language) || 'ar';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('pos_language', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = (path: string, params?: Record<string, any>) => {
    const keys = path.split('.');
    let result: any = translations[language];

    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        return path;
      }
    }

    if (typeof result === 'string' && params) {
      return Object.entries(params).reduce(
        (acc, [key, value]) => acc.replace(`{{${key}}}`, String(value)),
        result
      );
    }

    return typeof result === 'string' ? result : path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
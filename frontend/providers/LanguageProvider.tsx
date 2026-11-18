// ============================================================
// Emora AI — Language Context
// EN / AM (Amharic) toggle, persisted to localStorage.
// When a user is logged in, also saves to their profile.
// ============================================================

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

export type AppLanguage = 'en' | 'am';

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (l: AppLanguage) => void;
  t: (en: string, am: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (en) => en,
});

const STORAGE_KEY = 'emora_lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>('en');

  // Load from localStorage on mount (client only)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'am') setLangState(stored);
  }, []);

  const setLang = useCallback((l: AppLanguage) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    // Update html[lang] for screen readers
    document.documentElement.lang = l === 'am' ? 'am' : 'en';
  }, []);

  /** Simple bilingual helper: returns the string for the current language */
  const t = useCallback(
    (en: string, am: string) => (lang === 'am' ? am : en),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

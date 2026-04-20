import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import es from '../i18n/es.json';
import en from '../i18n/en.json';

const translations = { es, en };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem('fp-lang');
      if (saved === 'en' || saved === 'es') return saved;
    } catch {}
    return 'es';
  });

  useEffect(() => {
    try { localStorage.setItem('fp-lang', lang); } catch {}
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key, params) => {
    let str = translations[lang]?.[key] || translations.es[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    return str;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

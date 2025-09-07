import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { translations } from '../constants';
import { type Lang } from '../types';

const I18nContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string }>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => translations.en[key] ?? key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const t = (key: string) => translations[lang][key] ?? key;
  // FIX: Replaced JSX with React.createElement to prevent parsing errors in .ts files.
  return React.createElement(
    I18nContext.Provider,
    { value: { lang, setLang, t } },
    children
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

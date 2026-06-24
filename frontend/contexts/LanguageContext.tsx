import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'zh' | 'en';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  // 行内翻译：t('中文', 'English')
  t: (zh: string, en: string) => string;
}

const STORAGE_KEY = 'sweetcorn_lang';
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function readInitial(): Lang {
  if (typeof window === 'undefined') return 'zh';
  return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 语言是全局状态，存 localStorage，切换后跨页面/刷新都保持（优先级高于切换页面）
  const [lang, setLangState] = useState<Lang>(() => readInitial());

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => setLang(lang === 'zh' ? 'en' : 'zh'), [lang, setLang]);

  // 同步 <html lang="">
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    }
  }, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggle,
      t: (zh: string, en: string) => (lang === 'en' ? en : zh),
    }),
    [lang, setLang, toggle],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang 必须在 <LanguageProvider> 内使用');
  return ctx;
}

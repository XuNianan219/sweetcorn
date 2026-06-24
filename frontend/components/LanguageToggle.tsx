import React from 'react';
import { useLang } from '../contexts/LanguageContext';

// 右上角中/英切换（与整体黄绿调性一致）
export const LanguageToggle: React.FC = () => {
  const { lang, setLang } = useLang();
  const btn = (active: boolean) =>
    `px-2 py-1 rounded-full transition-colors ${active ? 'bg-green-600 text-white' : 'text-gray-500'}`;
  return (
    <div className="flex items-center rounded-full bg-white/70 border border-green-100 p-0.5 text-xs font-bold shrink-0">
      <button type="button" onClick={() => setLang('zh')} className={btn(lang === 'zh')} aria-label="中文">
        中
      </button>
      <button type="button" onClick={() => setLang('en')} className={btn(lang === 'en')} aria-label="English">
        EN
      </button>
    </div>
  );
};

export default LanguageToggle;

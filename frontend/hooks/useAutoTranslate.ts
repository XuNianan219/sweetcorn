import { useEffect, useRef, useState } from 'react';
import { useLang } from '../contexts/LanguageContext';
import { geminiService } from '../services/gemini';

export type TranslateType = 'post' | 'timeline' | 'product' | 'idea' | 'travelExperience' | 'travelRoute';

// 当全站语言为英文时，把传入的中文文字字段翻译成英文（走后端 /api/translate，命中数据库缓存则秒回）。
// 非英文 / 无 id 时直接返回原文。失败或加载中先返回原文，避免界面空白。
export function useAutoTranslate<T extends Record<string, string>>(
  type: TranslateType,
  id: string | undefined,
  fields: T,
): T {
  const { lang } = useLang();
  const [out, setOut] = useState<T>(fields);
  const fieldsKey = JSON.stringify(fields); // 内容变化时重新翻译

  // 用 ref 持有最新 fields，供 effect 内读取而不必进依赖
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  useEffect(() => {
    if (lang !== 'en' || !id) {
      setOut(fieldsRef.current);
      return;
    }
    let cancelled = false;
    const entries = Object.entries(fieldsRef.current) as [string, string][];
    Promise.all(
      entries.map(async ([field, text]) => {
        if (!text || !text.trim()) return [field, text] as const;
        try {
          const en = await geminiService.translateToEnglish(text, { type, id, field });
          return [field, en || text] as const;
        } catch {
          return [field, text] as const; // 失败回退原文
        }
      }),
    ).then((pairs) => {
      if (!cancelled) setOut(Object.fromEntries(pairs) as T);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, id, type, fieldsKey]);

  return lang === 'en' ? out : fields;
}

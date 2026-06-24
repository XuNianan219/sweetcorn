import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { getRoutes, type TravelRoute } from '../../services/travelService';
import { useAutoTranslate } from '../../hooks/useAutoTranslate';

// 内置样例（超管未发布任何线路时回退，保证页面不空白）
const FALLBACK = {
  title: '江南水乡 · 3 日慢游',
  titleEn: 'Jiangnan Water Towns · 3-Day Slow Trip',
  subtitle: '周庄 · 乌镇 · 西塘',
  subtitleEn: 'Zhouzhuang · Wuzhen · Xitang',
  description: 'AI 为你规划的三日精选路线，包含住宿与美食推荐',
  descriptionEn: 'An AI-curated 3-day route with stays and food picks',
  coverImage: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800',
  detailUrl: '',
};

export const WeeklyRouteBanner: React.FC = () => {
  const { t } = useLang();
  const [route, setRoute] = useState<TravelRoute | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRoutes()
      .then((rows) => {
        if (!cancelled && rows.length > 0) setRoute(rows[0]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // 官方线路：英文模式下译文走后端缓存
  const rtr = useAutoTranslate('travelRoute', route?.id, {
    title: route?.title || '',
    subtitle: route?.subtitle || '',
    description: route?.description || '',
  });

  // 有官方线路就用官方数据（已按语言取译文）；否则回退内置样例（en 为硬编码）
  const data = route
    ? {
        title: rtr.title, titleEn: rtr.title,
        subtitle: rtr.subtitle, subtitleEn: rtr.subtitle,
        description: rtr.description, descriptionEn: rtr.description,
        coverImage: route.coverImage || FALLBACK.coverImage,
        detailUrl: route.detailUrl,
      }
    : FALLBACK;

  const handleViewDetails = () => {
    if (data.detailUrl) window.open(data.detailUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="bg-[#fff8d6] rounded-3xl border border-green-100 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 md:p-10 flex flex-col justify-center space-y-5">
          <div className="flex items-center gap-2 text-xs font-black text-green-700 tracking-widest uppercase">
            <Sparkles size={14} />
            {t('本周精选线路', 'This week’s featured route')}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-green-950 leading-tight">
            {t(data.title, data.titleEn)}
          </h2>
          {data.subtitle && <p className="text-green-800 font-semibold">{t(data.subtitle, data.subtitleEn)}</p>}
          {data.description && (
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              {t('AI 精选 · 每周更新 — ', 'AI picks · weekly — ')}{t(data.description, data.descriptionEn)}
            </p>
          )}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleViewDetails}
              className="inline-flex items-center gap-2 px-6 py-3 gradient-ningyuzhi text-green-950 font-black rounded-2xl shadow-sm hover:scale-[1.03] transition-transform"
            >
              {t('查看详情', 'View details')}
              <ArrowRight size={16} />
            </button>
            {!data.detailUrl && <span className="text-xs text-gray-400 font-medium">{t('即将上线', 'Coming soon')}</span>}
          </div>
        </div>
        <div className="relative min-h-[220px] md:min-h-[320px] bg-green-50">
          <img
            src={data.coverImage}
            alt={data.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
};

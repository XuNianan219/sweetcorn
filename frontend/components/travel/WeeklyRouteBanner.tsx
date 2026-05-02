import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

const WEEKLY_ROUTE = {
  title: '江南水乡 · 3 日慢游',
  subtitle: '周庄 · 乌镇 · 西塘',
  description: 'AI 为你规划的三日精选路线，包含住宿与美食推荐',
  coverImage: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800',
};

export const WeeklyRouteBanner: React.FC = () => {
  const handleViewDetails = () => {
    // TODO: 接入真实详情页 / 攻略页
    console.log('[travel] banner → 查看详情（即将上线）');
  };

  return (
    <section className="bg-[#fff8d6] rounded-3xl border border-green-100 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 md:p-10 flex flex-col justify-center space-y-5">
          <div className="flex items-center gap-2 text-xs font-black text-green-700 tracking-widest uppercase">
            <Sparkles size={14} />
            本周精选线路
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-green-950 leading-tight">
            {WEEKLY_ROUTE.title}
          </h2>
          <p className="text-green-800 font-semibold">{WEEKLY_ROUTE.subtitle}</p>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            AI 精选 · 每周更新 — {WEEKLY_ROUTE.description}
          </p>
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleViewDetails}
              className="inline-flex items-center gap-2 px-6 py-3 gradient-ningyuzhi text-green-950 font-black rounded-2xl shadow-sm hover:scale-[1.03] transition-transform"
            >
              查看详情
              <ArrowRight size={16} />
            </button>
            <span className="text-xs text-gray-400 font-medium">即将上线</span>
          </div>
        </div>
        <div className="relative min-h-[220px] md:min-h-[320px] bg-green-50">
          <img
            src={WEEKLY_ROUTE.coverImage}
            alt={WEEKLY_ROUTE.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
};

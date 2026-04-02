import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HeartHandshake, Sparkles } from 'lucide-react';

export const Activity: React.FC = () => {
  return (
    <div className="space-y-10 animate-fadeIn pb-10">
      <div className="bg-white rounded-[2.8rem] p-10 border border-green-50 shadow-sm">
        <h1 className="text-4xl font-black text-green-950">活动区</h1>
        <p className="text-gray-500 mt-3">仅保留两类大项目：公益区域与应援区域</p>
      </div>

      <Link to="/activity/charity" className="block bg-white rounded-[2.8rem] border border-gray-100 shadow-sm overflow-hidden group">
        <div className="p-10 md:p-12 bg-gradient-to-r from-emerald-900 to-green-700 text-white relative">
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs uppercase tracking-widest font-black opacity-80">公益区域</p>
            <h2 className="text-4xl font-black mt-3">公益行动计划</h2>
            <p className="mt-3 text-green-100">关注长期价值，支持教育、生态与健康方向项目。</p>
          </div>
          <HeartHandshake size={150} className="absolute right-8 bottom-0 opacity-15" />
        </div>
        <div className="p-6 flex items-center justify-between">
          <span className="font-black text-green-900">进入公益项目</span>
          <ArrowRight className="group-hover:translate-x-1 transition-transform text-green-700" />
        </div>
      </Link>

      <Link to="/activity/support" className="block bg-white rounded-[2.8rem] border border-gray-100 shadow-sm overflow-hidden group">
        <div className="p-10 md:p-12 bg-gradient-to-r from-rose-900 to-red-700 text-white relative">
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs uppercase tracking-widest font-black opacity-80">应援区域</p>
            <h2 className="text-4xl font-black mt-3">应援执行计划</h2>
            <p className="mt-3 text-red-100">聚焦生日、周年、线下大屏、城市活动与联动宣传。</p>
          </div>
          <Sparkles size={140} className="absolute right-8 bottom-2 opacity-20" />
        </div>
        <div className="p-6 flex items-center justify-between">
          <span className="font-black text-rose-900">进入应援项目</span>
          <ArrowRight className="group-hover:translate-x-1 transition-transform text-rose-700" />
        </div>
      </Link>
    </div>
  );
};

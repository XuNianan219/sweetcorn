import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Sparkles, Users } from 'lucide-react';

const projects = [
  { id: 'support-1', name: '周年地铁灯箱应援', target: 80000, current: 61300, donors: 702, desc: '覆盖核心线路站点，集中展示主题视觉。' },
  { id: 'support-2', name: '生日城市大屏联动', target: 120000, current: 92500, donors: 944, desc: '多城同步点亮，线下打卡联动线上传播。' },
  { id: 'support-3', name: '线下应援包发放', target: 35000, current: 21900, donors: 315, desc: '制作手幅、透卡和互动物料，现场派发。' },
];

export const FanSupportProjects: React.FC = () => {
  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      <div className="flex items-center justify-between">
        <Link to="/activity" className="flex items-center gap-2 text-gray-500 hover:text-rose-600 font-black">
          <ArrowLeft size={18} />
          返回活动区
        </Link>
        <Link to="/activity/support/submit" className="px-6 py-3 bg-gray-950 text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-transform">
          应援项目提交
        </Link>
      </div>

      <div className="bg-white rounded-[2.8rem] p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Sparkles className="text-rose-700" />
          <h1 className="text-3xl font-black text-rose-950">应援区域</h1>
        </div>
        <p className="text-gray-500 mt-2">点击项目可查看进度与明细</p>
      </div>

      <div className="space-y-5">
        {projects.map((item) => {
          const percent = Math.min(100, Math.round((item.current / item.target) * 100));
          return (
            <article key={item.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">{item.name}</h3>
                  <p className="text-gray-500 mt-1">{item.desc}</p>
                </div>
                <button className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-sm font-black flex items-center gap-1">
                  查看详情 <ExternalLink size={14} />
                </button>
              </div>
              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-sm font-black">
                  <span className="text-rose-700">进度 {percent}%</span>
                  <span className="text-gray-400">￥{item.current} / ￥{item.target}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-600" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                  <Users size={12} />
                  已有 {item.donors} 人参与
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

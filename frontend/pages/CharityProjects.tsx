import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, HeartHandshake, Users } from 'lucide-react';

const projects = [
  { id: 'charity-1', name: '晨光助学计划', target: 50000, current: 33200, donors: 286, desc: '为山区学校补充图书与教学器材。' },
  { id: 'charity-2', name: '守护流浪动物基金', target: 30000, current: 18750, donors: 194, desc: '定向支持绝育、疫苗与领养推广。' },
  { id: 'charity-3', name: '江畔清洁行动', target: 20000, current: 14260, donors: 121, desc: '组织环保志愿活动并采购基础物资。' },
];

export const CharityProjects: React.FC = () => {
  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      <div className="flex items-center justify-between">
        <Link to="/activity" className="flex items-center gap-2 text-gray-500 hover:text-green-600 font-black">
          <ArrowLeft size={18} />
          返回活动区
        </Link>
        <Link to="/activity/charity/submit" className="px-6 py-3 bg-gray-950 text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-transform">
          公益项目提交
        </Link>
      </div>

      <div className="bg-white rounded-[2.8rem] p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <HeartHandshake className="text-green-700" />
          <h1 className="text-3xl font-black text-green-950">公益区域</h1>
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
                <button className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-black flex items-center gap-1">
                  查看详情 <ExternalLink size={14} />
                </button>
              </div>
              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-sm font-black">
                  <span className="text-green-700">进度 {percent}%</span>
                  <span className="text-gray-400">￥{item.current} / ￥{item.target}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600" style={{ width: `${percent}%` }} />
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

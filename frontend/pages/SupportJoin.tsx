
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Star, Share2, MapPin, ExternalLink } from 'lucide-react';

export const SupportJoin: React.FC = () => {
  // 应援项目数据，包含地理位置跳转
  const activeProjects = [
    { 
      id: 1, 
      title: '梓渝生日月·无锡大屏投送', 
      location: '无锡市 · 三阳广场大屏',
      mapUrl: 'https://www.google.com/maps/search/无锡+三阳广场',
      goal: '100000', 
      current: '85600', 
      donors: 1240, 
      cover: 'https://picsum.photos/seed/supp1/800/400' 
    },
    { 
      id: 2, 
      title: '田栩宁回归·公益午餐计划', 
      location: '线上 · 公益募捐平台',
      mapUrl: 'https://www.example-charity.com',
      goal: '50000', 
      current: '50000', 
      donors: 890, 
      cover: 'https://picsum.photos/seed/supp2/800/400', 
      completed: true 
    },
    { 
      id: 3, 
      title: '宁渝枝周年·上海线下红海派发', 
      location: '上海 · 梅赛德斯奔驰文化中心',
      mapUrl: 'https://www.google.com/maps/search/上海+梅赛德斯奔驰文化中心',
      goal: '20000', 
      current: '1200', 
      donors: 56, 
      cover: 'https://picsum.photos/seed/supp3/800/400' 
    },
  ];

  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <Link to="/activity" className="flex items-center gap-2 text-gray-500 hover:text-green-600 font-black transition-colors">
          <ArrowLeft size={20} /> 返回活动列表
        </Link>
        <h1 className="text-3xl font-black text-green-950">支持应援项目</h1>
        <div className="w-20" />
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeProjects.map(project => (
          <div key={project.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-50 flex flex-col md:flex-row group">
            <div className="md:w-1/3 relative h-64 md:h-auto overflow-hidden">
              <img src={project.cover} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={project.title} />
              {project.completed && (
                <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="bg-white text-green-900 px-6 py-2 rounded-full font-black flex items-center gap-2">
                    <CheckCircle2 /> 应援达成
                  </span>
                </div>
              )}
            </div>
            <div className="p-10 flex-grow space-y-6">
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-gray-900">{project.title}</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <button 
                    onClick={() => window.open(project.mapUrl, '_blank')}
                    className="flex items-center gap-1 text-sm font-black text-green-600 hover:underline"
                  >
                    <MapPin size={16} /> {project.location} <ExternalLink size={12} />
                  </button>
                  <span className="flex items-center gap-1 text-xs text-gray-400 font-bold"><Star size={14} className="text-yellow-400 fill-current" /> {project.donors} 人已响应</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm font-black">
                  <span className="text-green-600">实时进度: {Math.round((parseInt(project.current) / parseInt(project.goal)) * 100)}%</span>
                  <span className="text-gray-400">总目标: ¥{project.goal}</span>
                </div>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${project.completed ? 'bg-green-500' : 'gradient-ningyuzhi'}`} 
                    style={{ width: `${Math.min(100, (parseInt(project.current) / parseInt(project.goal)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  disabled={project.completed}
                  className="flex-grow py-4 gradient-redsea text-white font-black rounded-2xl shadow-lg disabled:opacity-50 hover:scale-105 transition-transform"
                >
                  {project.completed ? '感谢支持，项目圆满' : '投喂心动支持'}
                </button>
                <button className="p-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 transition-colors">
                  <Share2 size={24} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Heart, ArrowRight } from 'lucide-react';

export const Activity: React.FC = () => {
  const events = [
    { id: 1, title: '《夏日回响》线下见面会', date: '2024-06-20', location: '上海 · 梅赛德斯奔驰文化中心', type: '线下', status: '进行中' },
    { id: 2, title: '宁渝枝 · 周年直播', date: '2024-08-15', location: '线上 · 官方直播间', type: '线上', status: '预告中' },
  ];

  return (
    <div className="space-y-12 animate-fadeIn">
      <div className="bg-green-900 text-white rounded-[2.5rem] p-12 relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-4">活动中心 · 奔赴热爱</h1>
          <p className="text-green-100 opacity-80 max-w-lg text-lg font-medium">
            不错过每一次见面，不辜负每一次心动。这里汇聚了所有宁渝枝的官方及同好应援活动。
          </p>
        </div>
        <div className="absolute right-0 bottom-0 p-8 opacity-10">
          <Users size={200} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {events.map(event => (
          <div key={event.id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 flex flex-col md:flex-row md:items-center gap-8 group hover:border-green-300 transition-all shadow-sm">
            <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors shadow-inner">
              <span className="text-sm text-green-600 font-black uppercase">{event.date.split('-')[1]}月</span>
              <span className="text-3xl font-black text-green-950">{event.date.split('-')[2]}</span>
            </div>
            <div className="flex-grow space-y-3">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${event.type === '线下' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                  {event.type}
                </span>
                <span className="text-xs text-green-600 font-black px-3 py-1 bg-green-50 rounded-full">{event.status}</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900">{event.title}</h3>
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 font-bold">
                <span className="flex items-center gap-2"><Calendar size={16} /> {event.date}</span>
                <span className="flex items-center gap-2"><MapPin size={16} /> {event.location}</span>
              </div>
            </div>
            <Link 
              to="/support-join" 
              className="px-10 py-5 gradient-ningyuzhi text-green-950 font-black rounded-2xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
            >
              参与应援 <ArrowRight size={18} />
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] p-12 border border-green-50 shadow-xl flex flex-col md:flex-row items-center gap-10">
        <div className="w-24 h-24 rounded-[2rem] gradient-redsea flex items-center justify-center text-white shadow-lg flex-shrink-0">
          <Heart size={40} className="fill-current" />
        </div>
        <div className="flex-grow space-y-3 text-center md:text-left">
          <h2 className="text-3xl font-black text-gray-950">粉丝应援全球招募</h2>
          <p className="text-gray-500 font-medium max-w-xl">
            如果你有绝佳的创意、丰富的物料制作经验，或者想为线下的红海贡献一份力量，请通过下方申请通道加入我们。
          </p>
        </div>
        <Link 
          to="/support-apply" 
          className="px-12 py-5 bg-gray-950 text-white font-black rounded-2xl hover:bg-black shadow-xl hover:scale-105 transition-all flex items-center gap-2"
        >
          提交应援申请
        </Link>
      </div>
    </div>
  );
};

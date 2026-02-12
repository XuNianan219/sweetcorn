
import React from 'react';
import { MOCK_TIMELINE } from '../constants';
import { Heart } from 'lucide-react';

export const Timeline: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-3xl font-black text-center text-green-900 mb-16 flex items-center justify-center gap-3">
        <Heart className="text-red-500 fill-current" /> 栩你渝生恋爱观察站
      </h1>

      <div className="relative border-l-4 border-green-200 ml-8 space-y-12">
        {MOCK_TIMELINE.map((event, idx) => (
          <div key={event.id} className="relative pl-12">
            {/* Marker */}
            <div className="absolute -left-[22px] top-0 w-10 h-10 rounded-full gradient-ningyuzhi border-4 border-white shadow-md flex items-center justify-center font-bold text-green-800">
              {idx + 1}
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-50 hover:border-green-200 transition-colors">
              <span className="text-sm font-bold text-green-600 block mb-1">{event.date}</span>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>
              <p className="text-gray-600 leading-relaxed">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-16 text-center">
        <p className="text-gray-400 italic">更多甜蜜时刻，正在从后台加载中...</p>
      </div>
    </div>
  );
};

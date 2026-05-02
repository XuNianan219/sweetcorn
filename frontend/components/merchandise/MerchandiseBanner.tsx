import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const MerchandiseBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="gradient-ningyuzhi rounded-3xl p-8 md:p-12 text-green-950">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Sparkles size={18} className="text-green-700" />
            <span className="text-xs font-bold uppercase tracking-widest text-green-700">
              粉丝创意周边
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black">你的创意</h1>
          <p className="text-lg font-medium opacity-75">可能成为下一个爆款</p>
        </div>

        <button
          onClick={() => navigate('/merchandise/submit')}
          className="px-8 py-4 bg-white text-green-900 font-black rounded-2xl hover:scale-105 transition-transform shadow-lg whitespace-nowrap"
        >
          提交我的创意
        </button>
      </div>
    </div>
  );
};

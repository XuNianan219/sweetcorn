import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

export const MerchandiseBanner: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLang();

  return (
    <div className="gradient-ningyuzhi rounded-3xl p-6 md:p-12 text-green-950">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
        <div className="space-y-1.5 md:space-y-2 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Sparkles size={18} className="text-green-700" />
            <span className="text-xs font-bold uppercase tracking-widest text-green-700">
              {t('粉丝创意周边', 'Fan-made merch')}
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black">{t('你的创意', 'Your idea')}</h1>
          <p className="text-base md:text-lg font-medium opacity-75">{t('可能成为下一个爆款', 'could be the next hit')}</p>
        </div>

        <button
          onClick={() => navigate('/merchandise/submit')}
          className="px-6 py-2.5 md:px-8 md:py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-black rounded-2xl hover:scale-105 hover:shadow-xl transition-all duration-200 shadow-lg whitespace-nowrap min-h-[40px]"
        >
          {t('提交我的创意', 'Submit my idea')}
        </button>
      </div>
    </div>
  );
};

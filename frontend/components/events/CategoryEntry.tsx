import React from 'react';
import type { EventType } from '../../services/eventsService';
import { useLang } from '../../contexts/LanguageContext';

interface CategoryEntryProps {
  type: EventType;
  icon: string;
  title: string;
  count: number;
  active?: boolean;
  onClick?: () => void;
}

export const CategoryEntry: React.FC<CategoryEntryProps> = ({ icon, title, count, active, onClick }) => {
  const { t } = useLang();
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-[2rem] p-6 md:p-8 text-center transition-all hover:scale-[1.02] shadow-sm ${
        active
          ? 'gradient-ningyuzhi text-green-950 border-2 border-green-300'
          : 'bg-white border border-green-50 text-gray-700 hover:border-green-200'
      }`}
    >
      <div className="text-5xl mb-3">{icon}</div>
      <div className="text-xl font-black">{title}</div>
      <div className={`mt-1 text-sm font-bold ${active ? 'text-green-800' : 'text-gray-400'}`}>
        {count} {t('个活动', 'events')}
      </div>
    </button>
  );
};

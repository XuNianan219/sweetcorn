import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { useCurrentUser } from '../contexts/UserContext';
import { useLang } from '../contexts/LanguageContext';
import { getTimelineEntries, type TimelineEntry } from '../services/timelineEntriesService';

export const Timeline: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const { t } = useLang();
  const [dbEntries, setDbEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getTimelineEntries()
      .then((entries) => !cancelled && setDbEntries(entries))
      .catch(() => !cancelled && setDbEntries([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-3xl font-black text-center text-green-900 mb-16 flex items-center justify-center gap-3">
        <Heart className="text-red-500 fill-current" /> {t('栩你渝生恋爱观察站', 'Sweet Diary · Ziyu & Tianxuning')}
      </h1>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : dbEntries.length === 0 ? (
        <div className="text-center py-16 text-gray-400 font-medium">
          {t('还没有甜蜜时刻', 'No moments yet')}
          {isAdmin ? t('，点下方按钮添加第一条吧', ' — add the first one below') : t('，敬请期待', ' — coming soon')}
        </div>
      ) : (
        <div className="relative border-l-4 border-green-200 ml-8 space-y-12">
          {/* 全部条目均由管理员在后台维护，可点击进详情 */}
          {dbEntries.map((entry, idx) => (
            <div key={entry.id} className="relative pl-12">
              {/* Marker */}
              <div className="absolute -left-[22px] top-0 w-10 h-10 rounded-full gradient-ningyuzhi border-4 border-white shadow-md flex items-center justify-center font-bold text-green-800">
                {idx + 1}
              </div>

              <div
                onClick={() => navigate(`/timeline/entries/${entry.id}`)}
                className="group relative bg-white p-6 rounded-2xl shadow-sm border border-green-50 hover:border-green-200 transition-colors cursor-pointer"
              >
                <span className="text-sm font-bold text-green-600 block mb-1">{entry.date}</span>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{entry.title}</h3>
                <p className="text-gray-600 leading-relaxed">{entry.summary}</p>
                <ChevronRight
                  size={20}
                  className="absolute bottom-4 right-4 text-green-300 group-hover:text-green-500 transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 管理员入口：普通用户看不到 */}
      {isAdmin && (
        <div className="text-center my-8">
          <button
            onClick={() => navigate('/admin/timeline/new')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 text-yellow-300 font-black rounded-2xl shadow-md hover:bg-green-800 transition-colors"
          >
            <Plus size={18} />
            {t('添加新时间线条目', 'Add diary entry')}
          </button>
        </div>
      )}
    </div>
  );
};

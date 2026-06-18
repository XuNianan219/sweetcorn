
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_TIMELINE } from '../constants';
import { Heart, ChevronRight, Plus } from 'lucide-react';
import { useCurrentUser } from '../contexts/UserContext';
import { getTimelineEntries, type TimelineEntry } from '../services/timelineEntriesService';

export const Timeline: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
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

        {/* 管理员可编辑的追加条目（接续编号，样式与上方完全一致，可点击进详情） */}
        {dbEntries.map((entry, idx) => {
          const newIndex = MOCK_TIMELINE.length + idx + 1;
          return (
            <div key={entry.id} className="relative pl-12">
              {/* Marker */}
              <div className="absolute -left-[22px] top-0 w-10 h-10 rounded-full gradient-ningyuzhi border-4 border-white shadow-md flex items-center justify-center font-bold text-green-800">
                {newIndex}
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
          );
        })}
      </div>

      {/* 管理员入口：普通用户看不到 */}
      {isAdmin && (
        <div className="text-center my-8">
          <button
            onClick={() => navigate('/admin/timeline/new')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 text-yellow-300 font-black rounded-2xl shadow-md hover:bg-green-800 transition-colors"
          >
            <Plus size={18} />
            添加新时间线条目
          </button>
        </div>
      )}

      <div className="mt-16 text-center">
        <p className="text-gray-400 italic">
          {loading ? '更多甜蜜时刻，正在从后台加载中...' : '更多甜蜜时刻，持续记录中…'}
        </p>
      </div>
    </div>
  );
};

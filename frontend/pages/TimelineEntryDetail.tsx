import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTimelineEntry, type TimelineEntry } from '../services/timelineEntriesService';
import PageHeader from '../components/PageHeader';
import { LazyImage } from '../components/LazyImage';

export const TimelineEntryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<TimelineEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getTimelineEntry(id)
      .then((e) => !cancelled && setEntry(e))
      .catch((e) => !cancelled && setError(e?.message || '加载失败'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-[700px] mx-auto px-4 py-8 animate-pulse">
        <div className="h-5 w-20 bg-gray-100 rounded mb-6" />
        <div className="h-64 w-full bg-gray-100 rounded-2xl mb-6" />
        <div className="h-8 w-2/3 bg-gray-100 rounded mb-3" />
        <div className="h-4 w-28 bg-gray-100 rounded mb-6" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-11/12 bg-gray-100 rounded" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="max-w-[700px] mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-gray-500 font-medium">{error || '条目不存在'}</p>
        <button
          onClick={() => navigate('/timeline')}
          className="px-6 py-3 bg-green-700 text-yellow-300 font-black rounded-2xl hover:bg-green-800 transition-colors"
        >
          返回甜玉米日记
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto px-4 py-8 animate-fadeIn">
      <PageHeader title="日记详情" onBack={() => navigate('/timeline')} />

      <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm overflow-hidden">
        {entry.image && (
          <LazyImage src={entry.image} alt={entry.title} className="w-full max-h-[420px] object-cover" />
        )}
        <div className="p-6 md:p-8 space-y-3">
          <span className="text-sm font-bold text-green-600 block">{entry.date}</span>
          <h1 className="text-3xl font-black text-gray-900 leading-snug">{entry.title}</h1>
          {entry.content ? (
            <p className="text-[15px] text-gray-700 font-medium leading-relaxed whitespace-pre-wrap pt-2">
              {entry.content}
            </p>
          ) : (
            entry.summary && (
              <p className="text-[15px] text-gray-700 font-medium leading-relaxed whitespace-pre-wrap pt-2">
                {entry.summary}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
};

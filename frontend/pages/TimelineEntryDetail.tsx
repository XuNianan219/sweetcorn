import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTimelineEntry, type TimelineEntry } from '../services/timelineEntriesService';
import PageHeader from '../components/PageHeader';
import { LazyImage } from '../components/LazyImage';
import { useLang } from '../contexts/LanguageContext';
import { geminiService } from '../services/gemini';
import { showError } from '../utils/toast';

export const TimelineEntryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, t } = useLang();

  const [entry, setEntry] = useState<TimelineEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 日记是管理员自定义内容 → 提供 原文/English 切换
  const [showEn, setShowEn] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [trans, setTrans] = useState<{ title: string; body: string } | null>(null);

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
        <p className="text-gray-500 font-medium">{error || t('条目不存在', 'Entry not found')}</p>
        <button
          onClick={() => navigate('/timeline')}
          className="px-6 py-3 bg-green-700 text-yellow-300 font-black rounded-2xl hover:bg-green-800 transition-colors"
        >
          {t('返回甜玉米日记', 'Back to Diary')}
        </button>
      </div>
    );
  }

  const body = entry.content || entry.summary || '';

  const handleShowEnglish = async () => {
    setShowEn(true);
    if (trans || !entry) return;
    setTranslating(true);
    try {
      const [tt, tb] = await Promise.all([
        entry.title ? geminiService.translateToEnglish(entry.title, { type: 'timeline', id: entry.id, field: 'title' }) : Promise.resolve(''),
        body ? geminiService.translateToEnglish(body, { type: 'timeline', id: entry.id, field: 'content' }) : Promise.resolve(''),
      ]);
      setTrans({ title: tt, body: tb });
    } catch {
      showError(t('翻译失败，请稍后再试', 'Translation failed, try again'));
      setShowEn(false);
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto px-4 py-8 animate-fadeIn">
      <PageHeader title={t('日记详情', 'Diary')} onBack={() => navigate('/timeline')} />

      <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm overflow-hidden">
        {entry.image && (
          <LazyImage src={entry.image} alt={entry.title} className="w-full max-h-[420px] object-cover" />
        )}
        <div className="p-6 md:p-8 space-y-3">
          {/* 英文模式：原文 / English 切换 */}
          {lang === 'en' && (entry.title || body) && (
            <div className="flex items-center gap-0.5 bg-gray-50 rounded-full p-0.5 w-fit text-xs font-bold">
              <button
                onClick={() => setShowEn(false)}
                className={`px-3 py-1 rounded-full transition-colors ${!showEn ? 'bg-green-600 text-white' : 'text-gray-500'}`}
              >
                Original
              </button>
              <button
                onClick={handleShowEnglish}
                disabled={translating}
                className={`px-3 py-1 rounded-full transition-colors disabled:opacity-60 ${showEn ? 'bg-green-600 text-white' : 'text-gray-500'}`}
              >
                {translating ? '…' : 'English'}
              </button>
            </div>
          )}

          <span className="text-sm font-bold text-green-600 block">{entry.date}</span>
          <h1 className="text-3xl font-black text-gray-900 leading-snug">
            {showEn && trans ? trans.title : entry.title}
          </h1>
          {body && (
            <p className="text-[15px] text-gray-700 font-medium leading-relaxed whitespace-pre-wrap pt-2">
              {showEn && trans ? trans.body : body}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

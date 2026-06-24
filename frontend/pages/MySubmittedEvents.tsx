import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Loader2, Plus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useLang } from '../contexts/LanguageContext';
import {
  getMyEvents,
  formatEventDate,
  EVENT_TYPE_META,
  EVENT_TYPE_META_EN,
  type EventItem,
} from '../services/eventsService';

export const MySubmittedEvents: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [list, setList] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMyEvents()
      .then((res) => !cancelled && setList(res))
      .catch(() => !cancelled && setList([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const badge = (status: string) => {
    if (status === 'approved') return { text: t('已通过', 'Approved'), cls: 'bg-green-100 text-green-700' };
    if (status === 'rejected') return { text: t('已退回', 'Rejected'), cls: 'bg-red-100 text-red-600' };
    return { text: t('待审核', 'Pending'), cls: 'bg-yellow-100 text-yellow-700' };
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-24 md:pb-16 animate-fadeIn">
      <PageHeader
        title={t('我提交的活动', 'My Submissions')}
        rightSlot={
          <button
            onClick={() => navigate('/events/submit')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
          >
            <Plus size={15} />
            {t('提交活动', 'Submit')}
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 size={26} className="animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <CalendarDays size={44} className="mx-auto text-gray-200" />
          <p className="text-gray-400 font-bold">{t('你还没有提交过活动', 'You haven’t submitted any events yet')}</p>
          <button
            onClick={() => navigate('/events/submit')}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-green-700 text-yellow-300 text-sm font-black rounded-xl hover:bg-green-800 transition-colors"
          >
            <Plus size={16} /> {t('提交活动', 'Submit an event')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((ev) => {
            const meta = EVENT_TYPE_META[ev.eventType];
            const metaLabel = lang === 'en' ? EVENT_TYPE_META_EN[ev.eventType].label : meta.label;
            const b = badge(ev.status);
            return (
              <div key={ev.id} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-green-50 shadow-sm">
                {ev.coverImage ? (
                  <img src={ev.coverImage} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl gradient-ningyuzhi flex items-center justify-center text-2xl shrink-0">{meta.emoji}</div>
                )}
                <div className="flex-grow min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-50 text-green-700">{meta.emoji} {metaLabel}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${b.cls}`}>{b.text}</span>
                  </div>
                  <h3 className="font-black text-gray-900 leading-snug">{ev.title}</h3>
                  <p className="text-xs text-gray-400 font-medium">
                    {formatEventDate(ev.startAt, lang)}
                    {ev.location ? ` · ${ev.location}` : ''}
                  </p>
                  {ev.status === 'rejected' && ev.rejectReason && (
                    <p className="text-xs text-red-500 font-medium">
                      {t('退回原因：', 'Reason: ')}{ev.rejectReason}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

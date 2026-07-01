import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import {
  type EventItem,
  type EventType,
  getEvents,
  getPinnedEvents,
  getUpcomingEvents,
} from '../services/eventsService';
import { PullToRefreshWrapper } from '../components/PullToRefreshWrapper';
import { EventCard } from '../components/events/EventCard';
import { PinnedEventBanner } from '../components/events/PinnedEventBanner';
import { CountdownItem } from '../components/events/CountdownItem';
import { useLang } from '../contexts/LanguageContext';
import { useCurrentUser } from '../contexts/UserContext';

type FilterType = EventType | 'all';

const FILTER_TABS: { key: FilterType; label: string; labelEn: string }[] = [
  { key: 'all', label: '全部', labelEn: 'All' },
  { key: 'performance', label: '🎤 演出', labelEn: '🎤 Shows' },
  { key: 'merchandise', label: '🛍️ 周边', labelEn: '🛍️ Merch' },
  { key: 'endorsement', label: '📢 代言', labelEn: '📢 Deals' },
];

export const EventsBusiness: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const { isAdmin } = useCurrentUser();

  const [filter, setFilter] = useState<FilterType>('all');

  const [events, setEvents] = useState<EventItem[]>([]);
  const [pinned, setPinned] = useState<EventItem[]>([]);
  const [upcoming, setUpcoming] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 重点区数据：mount 时拉一次
  useEffect(() => {
    Promise.all([getPinnedEvents(), getUpcomingEvents(8)])
      .then(([p, u]) => {
        setPinned(p);
        setUpcoming(u);
      })
      .catch(() => {});
  }, []);

  // 列表：随筛选变化
  useEffect(() => {
    setLoading(true);
    setError('');
    getEvents(filter, 1, 40)
      .then((res) => setEvents(res.events))
      .catch((e) => setError(e?.message || t('加载失败', 'Failed to load')))
      .finally(() => setLoading(false));
  }, [filter]);

  const handleRefresh = useCallback(async () => {
    setError('');
    await Promise.all([
      getEvents(filter, 1, 40)
        .then((res) => setEvents(res.events))
        .catch((e) => setError(e?.message || t('加载失败', 'Failed to load'))),
      getPinnedEvents().then(setPinned).catch(() => {}),
      getUpcomingEvents(8).then(setUpcoming).catch(() => {}),
    ]);
  }, [filter]);

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <div className="space-y-8 pb-24 md:pb-16 animate-fadeIn">
        {/* 标题 */}
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-green-950">{t('嗑学情报站', 'Intel Station')}</h1>
          <p className="text-gray-500 font-medium mt-1">{t('跟踪明星动态，不错过每一刻', 'Track every moment of your stars')}</p>
          {isAdmin && (
            <button
              onClick={() => navigate('/events/mine')}
              className="mt-2 text-sm font-bold text-green-700 hover:text-green-800 transition-colors"
            >
              {t('我发布的活动 →', 'My uploads →')}
            </button>
          )}
        </div>

        {/* 类型筛选 */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                filter === tab.key
                  ? 'gradient-ningyuzhi text-green-950 shadow-sm'
                  : 'bg-white text-gray-500 hover:text-green-600 border border-green-50'
              }`}
            >
              {t(tab.label, tab.labelEn)}
            </button>
          ))}
        </div>

        {/* ───── 推荐（置顶）：横滑，一次展示多个 ───── */}
        {pinned.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-black text-green-950 flex items-center gap-2">
              ⭐ {t('推荐活动', 'Featured')}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
              {pinned.map((e) => (
                <div key={e.id} className="snap-start shrink-0 w-[90%] md:w-[66%]">
                  <PinnedEventBanner event={e} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ───── 即将开始：按开始时间排序，横滑 ───── */}
        {upcoming.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-black text-green-950 flex items-center gap-2">
              🗓️ {t('即将开始', 'Starting soon')}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {upcoming.slice(0, 8).map((e) => (
                <CountdownItem key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}

        {/* ───── 全部活动 ───── */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-green-950 border-b border-gray-100 pb-3">{t('全部活动', 'All events')}</h2>

          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-medium">{error}</div>
          )}

          {loading ? (
            <div className="flex justify-center py-16 text-gray-400">
              <Loader2 size={28} className="animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 text-gray-400 font-medium">{t('该分类暂无活动', 'No events in this category')}</div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </section>

        {/* 浮动提交按钮：仅管理员可上传 */}
        {isAdmin && (
          <button
            onClick={() => navigate('/events/submit')}
            aria-label={t('上传活动', 'Upload event')}
            className="fixed bottom-8 right-24 w-14 h-14 gradient-ningyuzhi rounded-full shadow-lg flex items-center justify-center text-green-900 z-50 hover:scale-110 active:scale-95 transition-transform"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </PullToRefreshWrapper>
  );
};

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Loader2, Plus } from 'lucide-react';
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
import { TimelineEvent } from '../components/events/TimelineEvent';
import { CategoryEntry } from '../components/events/CategoryEntry';

type LayoutVariant = 'A' | 'B' | 'C';
type FilterType = EventType | 'all';

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'performance', label: '🎤 演出' },
  { key: 'merchandise', label: '🛍️ 周边' },
  { key: 'endorsement', label: '📢 代言' },
];

export const EventsBusiness: React.FC = () => {
  const navigate = useNavigate();

  const [layout, setLayout] = useState<LayoutVariant>('A');
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
      .catch((e) => setError(e?.message || '加载失败'))
      .finally(() => setLoading(false));
  }, [filter]);

  // 布局 C 用：各类型数量（用全部列表 mount 时算；这里简单用置顶+列表估算→改为单独统计）
  const [counts, setCounts] = useState<Record<EventType, number>>({
    performance: 0,
    merchandise: 0,
    endorsement: 0,
  });
  useEffect(() => {
    getEvents('all', 1, 100)
      .then((res) => {
        const c: Record<EventType, number> = { performance: 0, merchandise: 0, endorsement: 0 };
        res.events.forEach((e) => {
          c[e.eventType] += 1;
        });
        setCounts(c);
      })
      .catch(() => {});
  }, []);

  const topPinned = pinned[0];
  const timelineEvents = useMemo(() => upcoming.slice(0, 8), [upcoming]);

  const handleRefresh = useCallback(async () => {
    setError('');
    await Promise.all([
      getEvents(filter, 1, 40)
        .then((res) => setEvents(res.events))
        .catch((e) => setError(e?.message || '加载失败')),
      getPinnedEvents().then(setPinned).catch(() => {}),
      getUpcomingEvents(8).then(setUpcoming).catch(() => {}),
    ]);
  }, [filter]);

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
    <div className="space-y-8 pb-24 md:pb-16 animate-fadeIn">
      {/* 标题 + 临时布局切换 */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-green-950">嗑学情报站</h1>
          <p className="text-gray-500 font-medium mt-1">跟踪明星动态，不错过每一刻</p>
        </div>

        {/* ⚠️ 临时开发用，确认布局后会删 */}
        <div className="bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-2xl p-2">
          <p className="text-[10px] font-black text-yellow-700 px-1 pb-1">
            ⚠️ 临时开发用·确认后会删
          </p>
          <div className="flex gap-1">
            {([
              ['A', '布局A 应援'],
              ['B', '布局B 时间线'],
              ['C', '布局C 商场'],
            ] as [LayoutVariant, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setLayout(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  layout === key
                    ? 'gradient-ningyuzhi text-green-950'
                    : 'bg-white text-gray-500 hover:text-green-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
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
            {tab.label}
          </button>
        ))}
      </div>

      {/* ───── 重点区（随布局变化） ───── */}
      {layout === 'A' && (
        <section className="space-y-5">
          {topPinned && <PinnedEventBanner event={topPinned} />}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-black text-green-950 flex items-center gap-2">
                🗓️ 即将开始
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {upcoming.slice(0, 5).map((e) => (
                  <CountdownItem key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {layout === 'B' && (
        <section className="space-y-4">
          <h2 className="text-lg font-black text-green-950 flex items-center gap-2">
            <Clock size={20} className="text-green-600" />
            重要时间线
          </h2>
          {timelineEvents.length === 0 ? (
            <p className="text-sm text-gray-400 font-medium">暂无即将开始的活动</p>
          ) : (
            <div>
              {timelineEvents.map((e, i) => (
                <TimelineEvent key={e.id} event={e} isLast={i === timelineEvents.length - 1} />
              ))}
            </div>
          )}
        </section>
      )}

      {layout === 'C' && (
        <section>
          <div className="flex flex-col sm:flex-row gap-4">
            <CategoryEntry
              type="performance"
              icon="🎤"
              title="演出行程"
              count={counts.performance}
              active={filter === 'performance'}
              onClick={() => setFilter('performance')}
            />
            <CategoryEntry
              type="merchandise"
              icon="🛍️"
              title="周边发售"
              count={counts.merchandise}
              active={filter === 'merchandise'}
              onClick={() => setFilter('merchandise')}
            />
            <CategoryEntry
              type="endorsement"
              icon="📢"
              title="代言公益"
              count={counts.endorsement}
              active={filter === 'endorsement'}
              onClick={() => setFilter('endorsement')}
            />
          </div>
        </section>
      )}

      {/* ───── 全部活动（3 布局通用） ───── */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-green-950 border-b border-gray-100 pb-3">全部活动</h2>

        {error && (
          <div className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-medium">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16 text-gray-400">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-medium">该分类暂无活动</div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      {/* 浮动提交按钮 */}
      <button
        onClick={() => navigate('/events/submit')}
        aria-label="提交活动"
        className="fixed bottom-8 right-24 w-14 h-14 gradient-ningyuzhi rounded-full shadow-lg flex items-center justify-center text-green-900 z-50 hover:scale-110 active:scale-95 transition-transform"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </div>
    </PullToRefreshWrapper>
  );
};

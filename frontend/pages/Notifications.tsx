import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarCheck,
  CalendarX,
  Heart,
  Lightbulb,
  Loader2,
  MessageCircle,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type NotificationItem,
} from '../services/notificationService';
import { timeAgo } from '../services/commentService';
import { showSuccess } from '../utils/toast';
import { useLang } from '../contexts/LanguageContext';

const PAGE_SIZE = 20;

// 系统/事件类通知的图标
function TypeIcon({ type }: { type: string }) {
  const cls = 'w-6 h-6';
  switch (type) {
    case 'like':
      return <Heart className={`${cls} text-red-500`} />;
    case 'comment':
      return <MessageCircle className={`${cls} text-green-600`} />;
    case 'follow':
      return <UserPlus className={`${cls} text-green-600`} />;
    case 'event_approved':
      return <CalendarCheck className={`${cls} text-green-600`} />;
    case 'event_rejected':
      return <CalendarX className={`${cls} text-red-500`} />;
    case 'idea_approved':
      return <Lightbulb className={`${cls} text-green-600`} />;
    case 'idea_rejected':
      return <XCircle className={`${cls} text-red-500`} />;
    default:
      return <Bell className={`${cls} text-green-600`} />;
  }
}

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (nextPage: number, replace: boolean) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await getNotifications(nextPage, PAGE_SIZE, false);
      setItems((prev) => (replace ? res.notifications : [...prev, ...res.notifications]));
      setHasMore(res.hasMore);
      setPage(nextPage);
    } catch {
      /* 错误已由 apiClient toast */
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(1, true);
  }, [load]);

  const handleClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      markAsRead(n.id).catch(() => {});
    }
    // /users/:id 暂无页面，仅标记已读不跳转，避免空白
    if (n.link && !n.link.startsWith('/users/')) {
      navigate(n.link);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBusyId(id);
    try {
      await deleteNotification(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      /* toast handled */
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      showSuccess(t('已全部标记为已读', 'All marked as read'));
    } catch {
      /* toast handled */
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-24 md:pb-16 animate-fadeIn">
      <PageHeader
        title={t('通知', 'Notifications')}
        rightSlot={
          items.some((n) => !n.isRead) ? (
            <button
              onClick={handleMarkAll}
              className="px-3 py-1.5 text-sm font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
            >
              {t('全部已读', 'Mark all read')}
            </button>
          ) : null
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 p-4 rounded-2xl bg-white border border-gray-50 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-grow space-y-2">
                <div className="h-3.5 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <Bell size={44} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-bold">{t('还没有通知，去逛逛吧', 'No notifications yet — go explore')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const actorIsUrl = !!n.actor?.avatarUrl && /^https?:\/\//.test(n.actor.avatarUrl);
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`group flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
                  n.isRead
                    ? 'bg-white border-gray-50 hover:border-green-100'
                    : 'bg-yellow-50 border-yellow-100 hover:bg-yellow-100/70'
                }`}
              >
                {/* 头像 / 类型图标 */}
                <div className="w-10 h-10 rounded-full bg-green-50 overflow-hidden shrink-0 flex items-center justify-center">
                  {actorIsUrl ? (
                    <img src={n.actor!.avatarUrl!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <TypeIcon type={n.type} />
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <p className="font-bold text-gray-900 text-sm leading-snug">{n.title}</p>
                  {n.content && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.content}</p>
                  )}
                  <p className="text-[11px] text-gray-400 font-medium mt-1">{timeAgo(n.createdAt)}</p>
                </div>

                {/* 未读点 / 删除 */}
                <div className="shrink-0 flex flex-col items-center gap-2">
                  {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1" />}
                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    disabled={busyId === n.id}
                    aria-label={t('删除通知', 'Delete notification')}
                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {busyId === n.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => load(page + 1, false)}
                disabled={loadingMore}
                className="px-5 py-2 text-sm font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loadingMore && <Loader2 size={15} className="animate-spin" />}
                {t('加载更多', 'Load more')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

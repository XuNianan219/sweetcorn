import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MessageCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getConversations, type Conversation, type MessageKind } from '../services/messageService';
import { timeAgo } from '../services/commentService';
import { useLang } from '../contexts/LanguageContext';

export const Conversations: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const TABS: { key: MessageKind; label: string }[] = [
    { key: 'social', label: t('社交互动', 'Social') },
    { key: 'commerce', label: t('电商咨询', 'Support') },
  ];
  const [tab, setTab] = useState<MessageKind>('social');
  const [list, setList] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getConversations(tab)
      .then((c) => !cancelled && setList(c))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-16 animate-fadeIn">
      <PageHeader title={t('私信', 'Messages')} />

      {/* 分箱 tab：社交互动 / 电商咨询 */}
      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
              tab === t.key
                ? 'bg-green-700 text-white'
                : 'bg-white text-gray-500 border border-green-50 hover:text-green-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="py-20 text-center">
          <MessageCircle size={44} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-bold">{t('还没有私信，去别人主页打个招呼吧~', 'No messages yet — say hi from someone’s profile')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((c) => {
            const isUrl = !!c.user.avatarUrl && /^https?:\/\//.test(c.user.avatarUrl);
            return (
              <button
                key={c.user.id}
                onClick={() => navigate(`/messages/${c.user.id}?kind=${tab}`)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border border-green-50 hover:border-green-200 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full bg-green-50 overflow-hidden shrink-0 flex items-center justify-center text-2xl">
                  {isUrl ? (
                    <img src={c.user.avatarUrl!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>🌽</span>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-800 truncate">{c.user.nickname || '玉米成员'}</span>
                    <span className="text-[11px] text-gray-400 font-medium shrink-0">{timeAgo(c.lastAt)}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{c.lastMessage}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center">
                    {c.unreadCount > 99 ? '99+' : c.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

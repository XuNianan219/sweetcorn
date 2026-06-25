import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send, MessageCircle, ChevronLeft } from 'lucide-react';
import {
  getSupportConversations,
  getSupportThread,
  replyAsSupport,
  type SupportConversation,
  type SupportMessage,
} from '../services/adminSupportService';
import { useLang } from '../contexts/LanguageContext';

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(
    d.getHours(),
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 管理员客服后台：左侧会话列表 + 右侧聊天/回复（移动端单栏切换）
export const AdminSupport: React.FC = () => {
  const { t } = useLang();
  const [convs, setConvs] = useState<SupportConversation[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [active, setActive] = useState<SupportConversation['user'] | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const loadConvs = useCallback(() => {
    getSupportConversations()
      .then(setConvs)
      .catch(() => {})
      .finally(() => setConvLoading(false));
  }, []);

  // 会话列表：进入即加载 + 每 10s 轮询
  useEffect(() => {
    loadConvs();
    const timer = setInterval(loadConvs, 10000);
    return () => clearInterval(timer);
  }, [loadConvs]);

  // 选中会话：加载聊天记录 + 每 5s 轮询
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setThreadLoading(true);
    const load = (first: boolean) => {
      getSupportThread(active.id)
        .then((m) => {
          if (cancelled) return;
          setMessages((prev) => {
            if (m.length !== prev.length) setTimeout(scrollToBottom, 50);
            return m;
          });
        })
        .catch(() => {})
        .finally(() => {
          if (first && !cancelled) setThreadLoading(false);
        });
    };
    load(true);
    const timer = setInterval(() => load(false), 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [active]);

  const openConv = (u: SupportConversation['user']) => {
    setActive(u);
    setMessages([]);
    // 打开即视为已读，前端先清角标（后端 thread 接口也会标记已读）
    setConvs((prev) => prev.map((c) => (c.user.id === u.id ? { ...c, unreadCount: 0 } : c)));
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending || !active) return;
    setSending(true);
    try {
      const m = await replyAsSupport(active.id, content);
      setMessages((prev) => [...prev, m]);
      setText('');
      setTimeout(scrollToBottom, 50);
      loadConvs();
    } catch {
      /* 错误已由 apiClient toast */
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm overflow-hidden">
      <div className="flex h-[60vh] min-h-[420px]">
        {/* 左：会话列表（移动端选中后隐藏） */}
        <div
          className={`${active ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 md:border-r border-green-50 shrink-0`}
        >
          <div className="px-4 py-3 border-b border-green-50 font-black text-green-950 text-sm">
            {t('客服会话', 'Conversations')}
          </div>
          <div className="flex-grow overflow-y-auto">
            {convLoading ? (
              <div className="flex justify-center py-12 text-gray-400">
                <Loader2 size={22} className="animate-spin" />
              </div>
            ) : convs.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm font-medium px-4">
                {t('还没有用户咨询', 'No customer messages yet')}
              </div>
            ) : (
              convs.map((c) => {
                const isUrl = !!c.user.avatarUrl && /^https?:\/\//.test(c.user.avatarUrl);
                const selected = active?.id === c.user.id;
                return (
                  <button
                    key={c.user.id}
                    onClick={() => openConv(c.user)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 transition-colors ${
                      selected ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-50 overflow-hidden shrink-0 flex items-center justify-center text-lg">
                      {isUrl ? <img src={c.user.avatarUrl!} alt="" className="w-full h-full object-cover" /> : <span>🌽</span>}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-gray-800 truncate">
                          {c.user.nickname || t('未命名', 'Unnamed')}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0">{timeLabel(c.lastAt)}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{c.lastMessage}</p>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] px-1 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 右：聊天 + 回复 */}
        <div className={`${active ? 'flex' : 'hidden md:flex'} flex-col flex-grow min-w-0`}>
          {!active ? (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-300 gap-2">
              <MessageCircle size={36} />
              <p className="text-sm font-medium">{t('选择左侧会话开始回复', 'Pick a conversation to reply')}</p>
            </div>
          ) : (
            <>
              <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-green-50">
                <button
                  onClick={() => setActive(null)}
                  className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                  aria-label={t('返回', 'Back')}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="font-black text-green-950 truncate">
                  {active.nickname || t('未命名', 'Unnamed')}
                </span>
              </div>

              <div className="flex-grow overflow-y-auto px-3 py-3 space-y-3 bg-[#fcf9e8]">
                {threadLoading ? (
                  <div className="flex justify-center py-12 text-gray-400">
                    <Loader2 size={22} className="animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm font-medium">
                    {t('暂无消息', 'No messages')}
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.fromSupport ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm font-medium leading-relaxed break-words whitespace-pre-wrap ${
                          m.fromSupport
                            ? 'bg-green-600 text-white rounded-br-md'
                            : 'bg-white border border-green-50 text-gray-800 rounded-bl-md'
                        }`}
                      >
                        {m.msgType === 'image' && m.imageUrl ? (
                          <img src={m.imageUrl} alt="" className="rounded-lg max-w-full" />
                        ) : (
                          m.content
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="shrink-0 flex items-end gap-2 px-3 py-3 border-t border-green-50">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 500))}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSend();
                  }}
                  rows={1}
                  placeholder={t('以客服身份回复…', 'Reply as support…')}
                  className="flex-grow px-4 py-2.5 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-green-100 text-sm font-medium resize-none max-h-24"
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  aria-label={t('发送', 'Send')}
                  className="shrink-0 w-11 h-11 rounded-full gradient-ningyuzhi text-green-950 flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-transform"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;

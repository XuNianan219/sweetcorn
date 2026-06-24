import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Send, X } from 'lucide-react';
import {
  getThread,
  sendMessage,
  type ChatMessage,
  type MessageKind,
} from '../services/messageService';
import { useLang } from '../contexts/LanguageContext';

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: string; // 对话方
  partnerName?: string;
  partnerAvatar?: string | null;
  kind?: MessageKind;
}

// 就地弹出的聊天框（仿微信/淘宝旺旺），复用私信接口
export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  open,
  onClose,
  userId,
  partnerName = '对话',
  partnerAvatar,
  kind = 'social',
}) => {
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { t } = useLang();

  const k: MessageKind = kind === 'commerce' ? 'commerce' : 'social';

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  // 开关动画
  useEffect(() => {
    if (open) {
      setRender(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = setTimeout(() => setRender(false), 250);
    return () => clearTimeout(t);
  }, [open]);

  // 打开时加载 + 轮询
  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoading(true);
    const load = (first: boolean) => {
      getThread(userId, k)
        .then((m) => {
          if (cancelled) return;
          setMessages((prev) => {
            if (m.length !== prev.length) setTimeout(scrollToBottom, 50);
            return m;
          });
        })
        .catch(() => {})
        .finally(() => {
          if (first && !cancelled) setLoading(false);
        });
    };
    load(true);
    const timer = setInterval(() => load(false), 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [open, userId, kind]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending || !userId) return;
    setSending(true);
    try {
      const m = await sendMessage(userId, content, k);
      setMessages((prev) => [...prev, m]);
      setText('');
      setTimeout(scrollToBottom, 50);
    } catch {
      /* 错误已由 apiClient toast */
    } finally {
      setSending(false);
    }
  };

  if (!render) return null;
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const avatarIsUrl = !!partnerAvatar && /^https?:\/\//.test(partnerAvatar);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center sm:justify-center">
      {/* 遮罩 */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* 聊天窗 */}
      <div
        onClick={stop}
        className={`relative w-full sm:max-w-md h-[72vh] sm:h-[560px] bg-[#fcf9e8] shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col transition-transform duration-250 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full sm:translate-y-4'
        }`}
      >
        {/* 头部 */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-green-50">
          <div className="w-9 h-9 rounded-full bg-green-50 overflow-hidden flex items-center justify-center text-lg">
            {avatarIsUrl ? (
              <img src={partnerAvatar!} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>🌽</span>
            )}
          </div>
          <div className="flex-grow min-w-0">
            <p className="font-black text-green-950 truncate leading-tight">{partnerName}</p>
            <p className="text-[11px] text-gray-400 font-medium">
              {kind === 'commerce' ? t('电商咨询', 'Support') : t('私信', 'Message')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('关闭', 'Close')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* 消息区 */}
        <div className="flex-grow overflow-y-auto px-3 py-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12 text-gray-400">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm font-medium">
              {t('发条消息开始咨询吧~', 'Send a message to start chatting~')}
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm font-medium leading-relaxed break-words whitespace-pre-wrap ${
                    m.isMine
                      ? 'bg-green-600 text-white rounded-br-md'
                      : 'bg-white border border-green-50 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* 输入栏 */}
        <div className="shrink-0 flex items-end gap-2 px-3 py-3 bg-white border-t border-green-50">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSend();
            }}
            rows={1}
            placeholder={t('输入消息…', 'Type a message…')}
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
      </div>
    </div>,
    document.body,
  );
};

export default ChatDrawer;

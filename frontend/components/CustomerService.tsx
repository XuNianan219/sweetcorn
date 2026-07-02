import React, { useEffect, useRef, useState } from 'react';
import { Headphones, X, Loader2, Send, UserRound } from 'lucide-react';
import { useLang } from '../contexts/LanguageContext';
import { useCurrentUser } from '../contexts/UserContext';
import { askAiSupport, type AiChatMessage } from '../services/aiSupportService';
import { getSupportContact } from '../services/messageService';
import { ChatDrawer } from './ChatDrawer';

// 常见问题快捷入口：点击即作为提问发给 AI 客服（答案统一由后端 FAQ 知识库驱动）
const QUICK_QUESTIONS = [
  '怎么下单购买周边？',
  '拼团怎么发起？',
  '多久发货 / 怎么查物流？',
  '怎么申请退款？',
];

// ─── 莫兰迪配色 ──────────────────────────────────────────────
const ACCENT = '#b08d8d';
const ACCENT_BG = '#efe7e3';
const TEXT = '#5c544a';
const BORDER = '#ece5df';

export const CustomerService: React.FC = () => {
  const { t } = useLang();
  const { isLoggedIn } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 转人工：官方客服聊天框（commerce，不受私信条数限制）
  const [humanOpen, setHumanOpen] = useState(false);
  const [humanLoading, setHumanLoading] = useState(false);
  const [supportTarget, setSupportTarget] = useState<{
    id: string;
    name: string;
    avatar: string | null;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [open]);

  // 只在登录后显示；未登录（含登录页 / 注册页）不渲染
  if (!isLoggedIn) return null;

  const ask = async (question: string) => {
    const content = question.trim();
    if (!content || sending) return;
    setError(null);
    const next: AiChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setSending(true);
    scrollToBottom();
    try {
      const reply = await askAiSupport(next);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch {
      setError(t('AI 客服暂时不可用，可以点击下方转人工客服', 'AI support is unavailable, try a human agent below'));
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const openHuman = async () => {
    if (humanLoading) return;
    setHumanLoading(true);
    try {
      const s = await getSupportContact();
      setSupportTarget({ id: s.id, name: s.nickname || t('官方客服', 'Support'), avatar: s.avatarUrl });
      setHumanOpen(true);
      setOpen(false);
    } catch {
      /* 错误已由 apiClient toast */
    } finally {
      setHumanLoading(false);
    }
  };

  return (
    <>
      {/* 展开的面板 */}
      {open && (
        <div
          className="fixed bottom-52 md:bottom-40 right-4 md:right-6 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white shadow-xl border overflow-hidden animate-fadeIn flex flex-col"
          style={{ borderColor: BORDER }}
        >
          {/* 头部 */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: ACCENT_BG }}
          >
            <span className="flex items-center gap-2 font-bold text-sm" style={{ color: TEXT }}>
              <Headphones size={16} style={{ color: ACCENT }} />
              {t('AI 客服', 'AI Support')}
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label={t('收起', 'Close')}
              className="p-1 rounded-full hover:bg-black/5 transition-colors"
              style={{ color: TEXT }}
            >
              <X size={16} />
            </button>
          </div>

          {/* 对话区 */}
          <div className="h-72 overflow-y-auto p-3 space-y-2.5">
            {/* 欢迎语 + 常见问题快捷入口 */}
            <div
              className="px-3 py-2.5 rounded-2xl rounded-bl-md text-sm leading-relaxed"
              style={{ background: '#faf7f5', color: TEXT }}
            >
              {t('你好呀~ 我是甜玉米 AI 客服，点下面的常见问题或直接输入提问吧！', "Hi! I'm the AI support bot. Tap a question below or type your own!")}
            </div>
            {messages.length === 0 && (
              <div className="space-y-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    className="block w-full text-left px-3 py-2 rounded-xl text-sm font-medium border transition-colors hover:bg-black/[0.03]"
                    style={{ color: ACCENT, borderColor: BORDER }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap ${
                    m.role === 'user' ? 'text-white rounded-br-md' : 'rounded-bl-md'
                  }`}
                  style={
                    m.role === 'user'
                      ? { background: ACCENT }
                      : { background: '#faf7f5', color: TEXT }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl rounded-bl-md" style={{ background: '#faf7f5' }}>
                  <Loader2 size={16} className="animate-spin" style={{ color: ACCENT }} />
                </div>
              </div>
            )}
            {error && (
              <p className="text-xs text-red-400 text-center px-2">{error}</p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 输入栏 */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-t" style={{ borderColor: BORDER }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') ask(input);
              }}
              placeholder={t('输入你的问题…', 'Type your question…')}
              className="flex-grow px-3 py-2 rounded-xl bg-gray-50 outline-none text-sm font-medium"
              style={{ color: TEXT }}
            />
            <button
              onClick={() => ask(input)}
              disabled={!input.trim() || sending}
              aria-label={t('发送', 'Send')}
              className="shrink-0 w-9 h-9 rounded-full text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
              style={{ background: ACCENT }}
            >
              <Send size={15} />
            </button>
          </div>

          {/* 转人工客服 */}
          <div className="p-3 border-t shrink-0" style={{ borderColor: BORDER }}>
            <button
              onClick={openHuman}
              disabled={humanLoading}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: ACCENT }}
            >
              {humanLoading ? <Loader2 size={16} className="animate-spin" /> : <UserRound size={16} />}
              {t('转人工客服', 'Talk to a human')}
            </button>
          </div>
        </div>
      )}

      {/* 悬浮圆形按钮 */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('客服', 'Support')}
        className="fixed bottom-36 md:bottom-24 right-4 md:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform"
        style={{ background: ACCENT }}
      >
        {open ? <X size={26} strokeWidth={2.5} /> : <Headphones size={26} strokeWidth={2.5} />}
      </button>

      {/* 人工客服聊天框（复用私信 ChatDrawer，commerce 类型） */}
      {supportTarget && (
        <ChatDrawer
          open={humanOpen}
          onClose={() => setHumanOpen(false)}
          userId={supportTarget.id}
          partnerName={supportTarget.name}
          partnerAvatar={supportTarget.avatar}
          kind="commerce"
        />
      )}
    </>
  );
};

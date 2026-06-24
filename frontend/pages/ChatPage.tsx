import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, Plus, Send } from 'lucide-react';
import {
  getThread,
  sendMessage,
  type ChatMessage,
  type MessageKind,
} from '../services/messageService';
import { getUserPublic } from '../services/userService';
import { getFollowStatus } from '../services/followService';
import { uploadMedia } from '../services/mediaService';
import { showError } from '../utils/toast';
import { useLang } from '../contexts/LanguageContext';

const MAX_IMAGE_MB = 10;

// 本地待发/失败消息（纯前端状态，不入库）
interface PendingMsg {
  clientId: string;
  status: 'sending' | 'failed';
  msgType: 'text' | 'image';
  content: string; // 文字内容（图片消息为 ''）
  imageUrl?: string; // 图片消息已上传到 R2 的地址（重发复用，无需再传）
}

export const ChatPage: React.FC = () => {
  const { t } = useLang();
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const kind: MessageKind = searchParams.get('kind') === 'commerce' ? 'commerce' : 'social';
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([]); // 服务器已存的消息
  const [pending, setPending] = useState<PendingMsg[]>([]); // 乐观显示的待发/失败消息
  const [partnerName, setPartnerName] = useState('对话');
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [follow, setFollow] = useState<{ following: boolean; followsMe: boolean; isMutual: boolean } | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  // 对方昵称（用于标题）
  useEffect(() => {
    if (!userId) return;
    getUserPublic(userId)
      .then((u) => setPartnerName(u.nickname || '玉米成员'))
      .catch(() => {});
  }, [userId]);

  // 关注关系（仅普通私信据此判断发送权限；电商咨询不限制）
  useEffect(() => {
    if (!userId || kind !== 'social') return;
    getFollowStatus(userId)
      .then(setFollow)
      .catch(() => {});
  }, [userId, kind]);

  // 加载 + 轮询（只刷新服务器消息，pending 保持不动）
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = (first: boolean) => {
      getThread(userId, kind)
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
  }, [userId, kind]);

  // ── 发送权限预判（social）：解锁=互关/对方关注我/对方回复过；否则只能发一条 ──
  const otherReplied = messages.some((m) => !m.isMine);
  const myServerCount = messages.filter((m) => m.isMine).length;
  const gated = kind === 'social' && !!follow && !follow.followsMe && !otherReplied;
  const blocked = gated && myServerCount >= 1;

  const doSend = async (item: PendingMsg) => {
    if (!userId) return;
    try {
      const m = await sendMessage(
        userId,
        item.content,
        kind,
        item.msgType === 'image' ? { imageUrl: item.imageUrl } : undefined,
      );
      setPending((prev) => prev.filter((p) => p.clientId !== item.clientId));
      setMessages((prev) => [...prev, m]);
      setTimeout(scrollToBottom, 50);
    } catch {
      // 失败（含被权限规则拦下 / 网络错误）→ 标红；apiClient 已弹具体原因 toast
      setPending((prev) => prev.map((p) => (p.clientId === item.clientId ? { ...p, status: 'failed' } : p)));
    }
  };

  const newClientId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const handleSendText = () => {
    const content = text.trim();
    if (!content || !userId || blocked) return;
    const item: PendingMsg = { clientId: newClientId(), status: 'sending', msgType: 'text', content };
    setPending((prev) => [...prev, item]);
    setText('');
    setTimeout(scrollToBottom, 50);
    doSend(item);
  };

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !userId || blocked) return;
    if (!file.type.startsWith('image/')) {
      showError(t('只能发送图片', 'Images only'));
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      showError(t(`图片不能超过 ${MAX_IMAGE_MB}MB`, `Image must be under ${MAX_IMAGE_MB}MB`));
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadMedia(file); // 复用发帖那套 R2 上传
      const item: PendingMsg = { clientId: newClientId(), status: 'sending', msgType: 'image', content: '', imageUrl: url };
      setPending((prev) => [...prev, item]);
      setTimeout(scrollToBottom, 50);
      doSend(item);
    } catch (err: any) {
      showError(err?.message || t('图片上传失败', 'Image upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const retry = (clientId: string) => {
    const item = pending.find((p) => p.clientId === clientId);
    if (!item) return;
    setPending((prev) => prev.map((p) => (p.clientId === clientId ? { ...p, status: 'sending' } : p)));
    doSend({ ...item, status: 'sending' });
  };

  // 消息气泡内容（文字 or 图片）
  const renderBody = (msgType: 'text' | 'image' | undefined, content: string, imageUrl?: string | null) => {
    if (msgType === 'image' && imageUrl) {
      return <img src={imageUrl} alt="" className="rounded-xl max-w-[200px] max-h-[260px] object-cover" />;
    }
    return content;
  };

  const hasText = !!text.trim();

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-7rem)] flex flex-col">
      {/* 头部 */}
      <div className="flex items-center gap-2 py-2 mb-2 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label={t('返回', 'Back')}
          className="shrink-0 w-10 h-10 rounded-full bg-yellow-50 hover:bg-yellow-100 text-green-800 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-black text-green-950 truncate">{partnerName}</h1>
      </div>

      {/* 消息列表 */}
      <div className="flex-grow overflow-y-auto space-y-3 px-1 pb-3">
        {loading ? (
          <div className="flex justify-center py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : messages.length === 0 && pending.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-medium text-sm">
            {t('还没有消息，打个招呼吧~', 'No messages yet — say hi!')}
          </div>
        ) : (
          <>
            {messages.map((m) => {
              const isImg = m.msgType === 'image' && !!m.imageUrl;
              return (
                <div key={m.id} className={`flex ${m.isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] text-sm font-medium leading-relaxed break-words whitespace-pre-wrap ${
                      isImg
                        ? 'p-1 rounded-2xl ' + (m.isMine ? 'bg-green-600' : 'bg-white border border-green-50')
                        : 'px-4 py-2.5 rounded-2xl ' +
                          (m.isMine
                            ? 'bg-green-600 text-white rounded-br-md'
                            : 'bg-white border border-green-50 text-gray-800 rounded-bl-md')
                    }`}
                  >
                    {renderBody(m.msgType, m.content, m.imageUrl)}
                  </div>
                </div>
              );
            })}

            {/* 乐观显示的待发/失败消息（全是我发的，右对齐）*/}
            {pending.map((p) => {
              const isImg = p.msgType === 'image' && !!p.imageUrl;
              return (
                <div key={p.clientId} className="flex justify-end items-center gap-1.5">
                  {p.status === 'failed' && (
                    <button
                      onClick={() => retry(p.clientId)}
                      aria-label={t('发送失败，点击重发', 'Failed — tap to resend')}
                      title={t('发送失败，点击重发', 'Failed — tap to resend')}
                      className="shrink-0 text-red-500 hover:text-red-600 transition-colors"
                    >
                      <AlertCircle size={18} />
                    </button>
                  )}
                  <div
                    className={`max-w-[75%] text-sm font-medium leading-relaxed break-words whitespace-pre-wrap text-white rounded-2xl rounded-br-md ${
                      isImg ? 'p-1' : 'px-4 py-2.5'
                    } ${p.status === 'failed' ? 'bg-green-600/50' : 'bg-green-600/80'}`}
                  >
                    {renderBody(p.msgType, p.content, p.imageUrl)}
                  </div>
                  {p.status === 'sending' && <Loader2 size={14} className="shrink-0 animate-spin text-gray-300" />}
                </div>
              );
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 受限提示 */}
      {blocked && (
        <div className="shrink-0 mb-1 px-3 py-2 bg-yellow-50 border border-yellow-100 text-yellow-700 rounded-xl text-xs font-bold text-center">
          {t('对方回应（回复或回关）前，只能发送一条私信', 'You can only send one message until they reply or follow you back')}
        </div>
      )}

      {/* 输入栏 */}
      <div className="shrink-0 flex items-end gap-2 pt-2 pb-3 border-t border-gray-100">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSendText();
          }}
          rows={1}
          disabled={blocked}
          placeholder={blocked ? t('已发送，等待对方回应…', 'Sent — waiting for their reply…') : t('发条消息…', 'Type a message…')}
          className="flex-grow px-4 py-2.5 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-green-100 text-sm font-medium resize-none max-h-28 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
        {hasText ? (
          // 有文字 → 发送
          <button
            onClick={handleSendText}
            disabled={blocked}
            className="shrink-0 w-11 h-11 rounded-full gradient-ningyuzhi text-green-950 flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-transform"
            aria-label={t('发送', 'Send')}
          >
            <Send size={18} />
          </button>
        ) : (
          // 空文字 → 加号（选图片），白色/透明样式
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={blocked || uploading}
            className="shrink-0 w-11 h-11 rounded-full bg-white border border-green-200 text-green-700 flex items-center justify-center disabled:opacity-50 hover:bg-green-50 transition-colors"
            aria-label={t('发图片', 'Send image')}
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} />}
          </button>
        )}
      </div>
    </div>
  );
};

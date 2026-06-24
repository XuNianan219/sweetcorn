import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Send } from 'lucide-react';
import { postComment, type CommentItem } from '../../services/commentService';
import { useCurrentUser } from '../../contexts/UserContext';
import { useLang } from '../../contexts/LanguageContext';
import { showSuccess } from '../../utils/toast';

interface CommentInputProps {
  postId: string;
  parentId?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSuccess: (comment: CommentItem) => void;
}

const MAX = 500;

export const CommentInput: React.FC<CommentInputProps> = ({
  postId,
  parentId,
  placeholder,
  autoFocus,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { isLoggedIn } = useCurrentUser();
  const { t } = useLang();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`; // 最多约 5 行
  };

  const handleSubmit = async () => {
    const text = content.trim();
    if (!text || submitting) return;
    if (text.length > MAX) {
      setError(t(`评论最多 ${MAX} 字`, `Comment max ${MAX} characters`));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const comment = await postComment({ postId, content: text, parentId });
      setContent('');
      if (taRef.current) taRef.current.style.height = 'auto';
      onSuccess(comment);
      showSuccess(parentId ? t('回复已发布', 'Reply posted') : t('评论已发布', 'Comment posted'));
    } catch (e: any) {
      setError(e?.message || t('发送失败', 'Failed to send'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <button
        onClick={() => navigate('/login')}
        className="w-full py-3 rounded-2xl bg-yellow-50 text-green-700 font-bold text-sm hover:bg-yellow-100 transition-colors border border-green-50"
      >
        {t('登录后评论', 'Log in to comment')}
      </button>
    );
  }

  return (
    <div className="bg-yellow-50/60 rounded-2xl border border-green-50 p-3 space-y-2">
      <textarea
        ref={taRef}
        value={content}
        autoFocus={autoFocus}
        onChange={(e) => {
          setContent(e.target.value.slice(0, MAX));
          autoGrow();
        }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit();
        }}
        placeholder={placeholder || t('说点什么吧…', 'Say something…')}
        rows={1}
        className="w-full bg-transparent resize-none outline-none text-sm font-medium placeholder:text-gray-300 leading-relaxed"
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${content.length >= MAX ? 'text-red-400' : 'text-gray-300'}`}>
          {content.length}/{MAX}
        </span>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="flex items-center gap-1.5 px-4 py-1.5 gradient-ningyuzhi text-green-950 font-black rounded-full text-sm hover:scale-[1.03] transition-transform disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {t('发送', 'Send')}
          </button>
        </div>
      </div>
    </div>
  );
};

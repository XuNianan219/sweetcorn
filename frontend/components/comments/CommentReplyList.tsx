import React from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { CommentItem as CommentData } from '../../services/commentService';
import { CommentItem } from './CommentItem';
import { useLang } from '../../contexts/LanguageContext';

interface CommentReplyListProps {
  parent: CommentData;
  expanded: boolean;
  loadingMore: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
  onLike: (c: CommentData) => void;
  onReply: (c: CommentData) => void;
  onDelete: (c: CommentData) => void;
  onExpand: (parent: CommentData) => void;
  onCollapse: (parent: CommentData) => void;
}

export const CommentReplyList: React.FC<CommentReplyListProps> = ({
  parent,
  expanded,
  loadingMore,
  currentUserId,
  isAdmin,
  onLike,
  onReply,
  onDelete,
  onExpand,
  onCollapse,
}) => {
  const { t } = useLang();
  const replies = parent.replies || [];
  if (replies.length === 0 && parent.replyCount === 0) return null;

  const hasMore = !expanded && parent.replyCount > replies.length;

  return (
    <div className="mt-1 space-y-0.5">
      {replies.map((r) => (
        <CommentItem
          key={r.id}
          comment={r}
          depth={1}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onLike={onLike}
          onReply={onReply}
          onDelete={onDelete}
        />
      ))}

      {hasMore && (
        <button
          onClick={() => onExpand(parent)}
          disabled={loadingMore}
          className="ml-8 flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-700 py-1"
        >
          {loadingMore ? <Loader2 size={13} className="animate-spin" /> : <ChevronDown size={14} />}
          {t(`查看全部 ${parent.replyCount} 条回复`, `View all ${parent.replyCount} replies`)}
        </button>
      )}

      {expanded && parent.replyCount > 3 && (
        <button
          onClick={() => onCollapse(parent)}
          className="ml-8 flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600 py-1"
        >
          <ChevronUp size={14} />
          {t('收起回复', 'Collapse replies')}
        </button>
      )}
    </div>
  );
};

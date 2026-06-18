import React from 'react';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { type CommentItem as CommentData, timeAgo } from '../../services/commentService';

interface CommentItemProps {
  comment: CommentData;
  depth?: 0 | 1;
  currentUserId?: string;
  isAdmin?: boolean;
  onLike: (comment: CommentData) => void;
  onReply: (comment: CommentData) => void;
  onDelete: (comment: CommentData) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  depth = 0,
  currentUserId,
  isAdmin,
  onLike,
  onReply,
  onDelete,
}) => {
  const nickname = comment.author?.nickname || '匿名玉米';
  const avatar = comment.author?.avatarUrl || '';
  const isAvatarUrl = avatar && /^https?:\/\//.test(avatar);
  const canDelete =
    !comment.isDeleted && (comment.author?.id === currentUserId || isAdmin) && !!currentUserId;

  const body = (
    <div className="flex gap-3 group/comment rounded-2xl p-2.5 hover:bg-yellow-50/70 transition-colors">
      {/* 头像 */}
      <div className="w-9 h-9 rounded-full bg-green-50 overflow-hidden shrink-0 flex items-center justify-center text-base">
        {comment.isDeleted ? (
          <span>🗑️</span>
        ) : isAvatarUrl ? (
          <img src={avatar} alt={nickname} className="w-full h-full object-cover" />
        ) : (
          <span>🌽</span>
        )}
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-700">{comment.isDeleted ? '已删除' : nickname}</span>
          <span className="text-xs text-gray-300 font-medium">{timeAgo(comment.createdAt)}</span>
          {canDelete && (
            <button
              onClick={() => onDelete(comment)}
              className="ml-auto opacity-0 group-hover/comment:opacity-100 text-gray-300 hover:text-red-500 transition-all"
              title="删除"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <p
          className={`text-sm mt-0.5 leading-relaxed break-words ${
            comment.isDeleted ? 'text-gray-300 italic' : 'text-gray-800 font-medium'
          }`}
        >
          {comment.isDeleted ? '[该评论已删除]' : comment.content}
        </p>

        {!comment.isDeleted && (
          <div className="flex items-center gap-4 mt-1.5">
            <button
              onClick={() => onLike(comment)}
              className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
            >
              <Heart
                size={15}
                className={comment.isLikedByMe ? 'text-red-500' : ''}
                fill={comment.isLikedByMe ? 'currentColor' : 'none'}
              />
              {comment.likeCount > 0 && <span className={comment.isLikedByMe ? 'text-red-500' : ''}>{comment.likeCount}</span>}
            </button>
            <button
              onClick={() => onReply(comment)}
              className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-green-600 transition-colors"
            >
              <MessageCircle size={15} />
              回复
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // 楼中楼缩进：左侧深绿色细竖线 + 左边距
  if (depth === 1) {
    return <div className="ml-8 pl-3 border-l-2 border-green-200">{body}</div>;
  }
  return body;
};

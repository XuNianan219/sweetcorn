// Feed 流里单个帖子卡片（小红书风格：图在上、文字在下，点赞爱心右下角）
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Trash2, ShieldX } from 'lucide-react';
import { type FeedPost, toggleLike, deletePost } from '../services/feedService';
import { useCurrentUser } from '../contexts/UserContext';
import { LazyImage } from './LazyImage';

interface PostCardProps {
  post: FeedPost;
  onChange?: (next: FeedPost) => void;
  onDeleted?: (id: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onChange, onDeleted }) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const isOwner = !!user && user.id === post.authorId;
  // 自己的帖子显示「删除」；不是自己的但我是管理员显示「管理员删除」
  const canSelfDelete = isOwner;
  const canAdminDelete = !isOwner && isAdmin;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;
    const message = canSelfDelete
      ? '确定删除？可在个人主页回收站恢复'
      : '这条帖子将被永久从前台移除，是否确认？';
    if (!window.confirm(message)) return;
    setDeleting(true);
    try {
      await deletePost(post.id);
      setDeleted(true); // 乐观更新：立刻从列表移除
      onDeleted?.(post.id);
    } catch (err) {
      // 错误提示已由 apiClient 统一 toast，这里只需恢复可点击状态
      // eslint-disable-next-line no-console
      console.warn('删除失败', err);
      setDeleting(false);
    }
  };

  const imageUrl =
    post.mediaType === 'image' && post.mediaUrls.length > 0 ? post.mediaUrls[0] : null;

  const handleCardClick = () => {
    navigate(`/posts/${post.id}`);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);

    // 乐观更新
    const prev = post;
    const optimistic: FeedPost = {
      ...post,
      isLikedByMe: !post.isLikedByMe,
      likeCount: post.likeCount + (post.isLikedByMe ? -1 : 1),
    };
    onChange?.(optimistic);

    try {
      const res = await toggleLike(post.id);
      onChange?.({ ...optimistic, isLikedByMe: res.liked, likeCount: res.likeCount });
    } catch (err) {
      // 失败回滚
      onChange?.(prev);
      // eslint-disable-next-line no-console
      console.warn('点赞失败', err);
    } finally {
      setBusy(false);
    }
  };

  const displayTitle = post.title?.trim() || post.content?.trim().slice(0, 40) || '';

  if (deleted) return null;

  return (
    <div
      onClick={handleCardClick}
      className="card-clickable group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow break-inside-avoid mb-3 md:mb-4 border border-gray-100"
    >
      {imageUrl ? (
        <div className="w-full overflow-hidden bg-gray-50">
          <LazyImage
            src={imageUrl}
            alt={displayTitle || '帖子封面'}
            className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      ) : null}

      <div className="p-3 space-y-2">
        {displayTitle ? (
          <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
            {displayTitle}
          </h3>
        ) : null}

        {!imageUrl && post.content && post.content !== displayTitle ? (
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{post.content}</p>
        ) : null}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 min-w-0">
            {post.author?.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt=""
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full gradient-ningyuzhi flex-shrink-0" />
            )}
            <span className="text-xs text-gray-500 truncate">
              {post.author?.nickname || '匿名玉米'}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* 评论数：点击冒泡到卡片 → 跳详情页评论区 */}
            <span className="flex items-center gap-1 text-xs text-gray-500" aria-label="评论">
              <MessageCircle size={16} />
              <span>{post.commentCount ?? 0}</span>
            </span>

            <button
              onClick={handleLike}
              disabled={busy}
              aria-label={post.isLikedByMe ? '取消点赞' : '点赞'}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <Heart
                size={16}
                className={post.isLikedByMe ? 'fill-red-500 text-red-500' : ''}
              />
              <span>{post.likeCount}</span>
            </button>
          </div>
        </div>

        {/* 删除入口：自己删（绿色文字）/ 管理员删（红色警告边框） */}
        {canSelfDelete ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
            删除
          </button>
        ) : canAdminDelete ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold text-red-600 border border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <ShieldX size={14} />
            管理员删除
          </button>
        ) : null}
      </div>
    </div>
  );
};

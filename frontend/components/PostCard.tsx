// Feed 流里单个帖子卡片（小红书风格：图在上、文字在下，点赞爱心右下角）
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Trash2, ShieldX } from 'lucide-react';
import { type FeedPost, toggleLike, deletePost } from '../services/feedService';
import { useCurrentUser } from '../contexts/UserContext';
import { useLang } from '../contexts/LanguageContext';
import { LazyImage } from './LazyImage';

interface PostCardProps {
  post: FeedPost;
  onChange?: (next: FeedPost) => void;
  onDeleted?: (id: string) => void;
  typeBadge?: string; // 首页流的类型角标（视频/图文）；其它页面不传则不显示
}

// 类型角标样式（圆角灰底白字，叠图上 / 行内通用）
const BADGE_CLS = 'px-2 py-0.5 rounded-full text-[10px] font-black bg-black/55 text-white';

export const PostCard: React.FC<PostCardProps> = ({ post, onChange, onDeleted, typeBadge }) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();
  const { t } = useLang();
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
      ? t('确定删除？可在个人主页回收站恢复', 'Delete this? You can restore it from your profile recycle bin.')
      : t('这条帖子将被永久从前台移除，是否确认？', 'This post will be permanently removed from the front end. Continue?');
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
        <div className="relative w-full overflow-hidden bg-gray-50">
          {/* 有图：角标叠在封面左上角 */}
          {typeBadge ? (
            <span className={`absolute top-2 left-2 z-10 backdrop-blur-sm ${BADGE_CLS}`}>{typeBadge}</span>
          ) : null}
          <LazyImage
            src={imageUrl}
            alt={displayTitle || t('帖子封面', 'Post cover')}
            className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      ) : null}

      <div className="p-3 space-y-2">
        {displayTitle ? (
          <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
            {/* 无图：角标与标题同行，排在最前 */}
            {!imageUrl && typeBadge ? (
              <span className={`inline-block align-[1px] mr-1.5 ${BADGE_CLS}`}>{typeBadge}</span>
            ) : null}
            {displayTitle}
          </h3>
        ) : null}

        {!imageUrl && post.content && post.content !== displayTitle ? (
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{post.content}</p>
        ) : null}

        <div className="flex items-center justify-between pt-1">
          <div
            className="flex items-center gap-2 min-w-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (post.authorId) navigate(`/users/${post.authorId}`);
            }}
          >
            {post.author?.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt=""
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full gradient-ningyuzhi flex-shrink-0" />
            )}
            <span className="text-xs text-gray-500 truncate hover:text-green-600 transition-colors">
              {post.author?.nickname || t('匿名玉米', 'Anonymous corn')}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* 评论数：点击冒泡到卡片 → 跳详情页评论区 */}
            <span className="flex items-center gap-1 text-xs text-gray-500" aria-label={t('评论', 'Comments')}>
              <MessageCircle size={16} />
              <span>{post.commentCount ?? 0}</span>
            </span>

            <button
              onClick={handleLike}
              disabled={busy}
              aria-label={post.isLikedByMe ? t('取消点赞', 'Unlike') : t('点赞', 'Like')}
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
            {t('删除', 'Delete')}
          </button>
        ) : canAdminDelete ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold text-red-600 border border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <ShieldX size={14} />
            {t('管理员删除', 'Admin delete')}
          </button>
        ) : null}
      </div>
    </div>
  );
};

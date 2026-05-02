// Feed 流里单个帖子卡片（小红书风格：图在上、文字在下，点赞爱心右下角）
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { type FeedPost, toggleLike } from '../services/feedService';

interface PostCardProps {
  post: FeedPost;
  onChange?: (next: FeedPost) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onChange }) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

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

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow break-inside-avoid mb-4 border border-gray-100"
    >
      {imageUrl ? (
        <div className="w-full overflow-hidden bg-gray-50">
          <img
            src={imageUrl}
            alt={displayTitle || '帖子封面'}
            loading="lazy"
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

          <button
            onClick={handleLike}
            disabled={busy}
            aria-label={post.isLikedByMe ? '取消点赞' : '点赞'}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <Heart
              size={16}
              className={post.isLikedByMe ? 'fill-red-500 text-red-500' : ''}
            />
            <span>{post.likeCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

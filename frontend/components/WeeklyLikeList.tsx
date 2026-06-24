import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { type FeedPost } from '../services/feedService';
import { useLang } from '../contexts/LanguageContext';

interface WeeklyLikeListProps {
  posts: FeedPost[];
  onToggleLike: (postId: string) => void;
}

export const WeeklyLikeList: React.FC<WeeklyLikeListProps> = ({ posts, onToggleLike }) => {
  const navigate = useNavigate();
  const { t } = useLang();
  if (!posts || posts.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-700 tracking-wide mb-4">{t('本周 Like', 'Weekly Likes')}</h2>
      <ul className="divide-y divide-gray-100">
        {posts.map((post) => {
          const thumb =
            post.mediaType === 'image' && post.mediaUrls.length > 0 ? post.mediaUrls[0] : null;
          const title = post.title?.trim() || post.content?.trim().slice(0, 30) || t('无题', 'Untitled');
          return (
            <li
              key={post.id}
              onClick={() => navigate(`/posts/${post.id}`)}
              className="flex items-center gap-3 py-3 cursor-pointer group hover:bg-gray-50/60 -mx-2 px-2 rounded-lg transition-colors"
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-50"
                  loading="lazy"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg gradient-ningyuzhi flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate group-hover:text-green-700 transition-colors">
                  {title}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 truncate">
                  {post.author?.nickname || t('匿名玉米', 'Anonymous corn')}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike(post.id);
                }}
                aria-label={post.isLikedByMe ? t('取消点赞', 'Unlike') : t('点赞', 'Like')}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Heart
                  size={18}
                  className={post.isLikedByMe ? 'fill-red-500 text-red-500' : ''}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

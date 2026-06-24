import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { type FeedPost } from '../services/feedService';
import { useLang } from '../contexts/LanguageContext';

interface WeeklyLikeCardsProps {
  posts: FeedPost[];
  onToggleLike: (postId: string) => void;
}

export const WeeklyLikeCards: React.FC<WeeklyLikeCardsProps> = ({ posts, onToggleLike }) => {
  const navigate = useNavigate();
  const { t } = useLang();
  if (!posts || posts.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-700 tracking-wide mb-4">{t('本周 Like', 'Weekly Likes')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map((post) => {
          const img =
            post.mediaType === 'image' && post.mediaUrls.length > 0 ? post.mediaUrls[0] : null;
          const title = post.title?.trim() || post.content?.trim().slice(0, 30) || t('无题', 'Untitled');
          return (
            <article
              key={post.id}
              onClick={() => navigate(`/posts/${post.id}`)}
              className="group relative cursor-pointer rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-md transition-shadow"
            >
              {img ? (
                <div className="w-full aspect-[4/5] overflow-hidden bg-gray-50">
                  <img
                    src={img}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[4/5] gradient-ningyuzhi flex items-center justify-center p-6">
                  <span className="text-xl font-bold text-green-950 text-center line-clamp-4 leading-snug">
                    {title}
                  </span>
                </div>
              )}

              <div className="p-3 pr-12">
                <div className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                  {title}
                </div>
                <div className="text-xs text-gray-400 mt-1 truncate">
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
                className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur text-gray-400 hover:text-red-500 transition-colors shadow-sm"
              >
                <Heart
                  size={16}
                  className={post.isLikedByMe ? 'fill-red-500 text-red-500' : ''}
                />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { type FeedPost } from '../services/feedService';

interface WeeklyLikeTextProps {
  posts: FeedPost[];
  onToggleLike: (postId: string) => void;
}

export const WeeklyLikeText: React.FC<WeeklyLikeTextProps> = ({ posts, onToggleLike }) => {
  const navigate = useNavigate();
  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-2">
      <h2 className="text-sm font-semibold text-gray-700 tracking-wide mb-4">本周 Like</h2>
      <ul className="space-y-5">
        {posts.map((post) => {
          const title = post.title?.trim() || post.content?.trim().slice(0, 40) || '无题';
          return (
            <li
              key={post.id}
              onClick={() => navigate(`/posts/${post.id}`)}
              className="group flex items-center gap-3 cursor-pointer"
            >
              <span className="text-gray-300 text-lg leading-none select-none">·</span>
              <div className="min-w-0 flex-1 flex items-baseline gap-3 flex-wrap">
                <span className="text-base font-semibold text-gray-900 group-hover:text-green-700 transition-colors truncate">
                  {title}
                </span>
                <span className="text-xs text-gray-400 truncate">
                  —— {post.author?.nickname || '匿名玉米'}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike(post.id);
                }}
                aria-label={post.isLikedByMe ? '取消点赞' : '点赞'}
                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Heart
                  size={16}
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

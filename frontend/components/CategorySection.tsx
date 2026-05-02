import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  type FeedPost,
  getCategoryFeed,
  getCategoryTop,
  toggleLike,
} from '../services/feedService';
import { getCategoryName } from '../constants/categories';
import { PostCard } from './PostCard';
import { WeeklyLikeList } from './WeeklyLikeList';
import { WeeklyLikeCards } from './WeeklyLikeCards';
import { WeeklyLikeText } from './WeeklyLikeText';
import { PostComposer } from './PostComposer';

type CategoryKey = 'discussion' | 'media' | 'article';
type SortKey = 'latest' | 'hot';

interface CategorySectionProps {
  category: CategoryKey;
}

const PAGE_SIZE = 20;

export const CategorySection: React.FC<CategorySectionProps> = ({ category }) => {
  const [topPosts, setTopPosts] = useState<FeedPost[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [sort, setSort] = useState<SortKey>('latest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);

  const categoryName = getCategoryName(category);

  // 本周 Like 仅在 mount / category 切换时拉取
  useEffect(() => {
    let cancelled = false;
    getCategoryTop(category, 3)
      .then((res) => {
        if (!cancelled) setTopPosts(res.posts);
      })
      .catch(() => {
        if (!cancelled) setTopPosts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  // 加载列表（带防竞态 requestId）
  const fetchPage = useCallback(
    async (nextPage: number, nextSort: SortKey, replace: boolean) => {
      const reqId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const res = await getCategoryFeed(category, nextPage, PAGE_SIZE, nextSort);
        if (reqId !== requestIdRef.current) return;
        setPosts((prev) => (replace ? res.posts : [...prev, ...res.posts]));
        setHasMore(res.hasMore);
        setPage(nextPage);
      } catch (e: any) {
        if (reqId !== requestIdRef.current) return;
        setError(e?.message || '加载失败');
      } finally {
        if (reqId === requestIdRef.current) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    },
    [category],
  );

  // category 或 sort 变化时重置
  useEffect(() => {
    setInitialLoading(true);
    setPosts([]);
    setHasMore(false);
    setPage(1);
    fetchPage(1, sort, true);
  }, [category, sort, fetchPage]);

  // 无限滚动
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          fetchPage(page + 1, sort, false);
        }
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, page, sort, fetchPage]);

  // 乐观更新点赞（本周 Like 模块里的 toggle）
  const handleTopToggleLike = async (postId: string) => {
    const target = topPosts.find((p) => p.id === postId);
    if (!target) return;
    const optimistic: FeedPost = {
      ...target,
      isLikedByMe: !target.isLikedByMe,
      likeCount: target.likeCount + (target.isLikedByMe ? -1 : 1),
    };
    setTopPosts((prev) => prev.map((p) => (p.id === postId ? optimistic : p)));
    // 同步到瀑布流里同一条帖子
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...optimistic } : p)));
    try {
      const res = await toggleLike(postId);
      setTopPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, isLikedByMe: res.liked, likeCount: res.likeCount } : p,
        ),
      );
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, isLikedByMe: res.liked, likeCount: res.likeCount } : p,
        ),
      );
    } catch {
      setTopPosts((prev) => prev.map((p) => (p.id === postId ? target : p)));
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...target } : p)));
    }
  };

  // 瀑布流里的 PostCard onChange
  const handlePostChange = (next: FeedPost) => {
    setPosts((prev) => prev.map((p) => (p.id === next.id ? next : p)));
    setTopPosts((prev) =>
      prev.map((p) =>
        p.id === next.id ? { ...p, isLikedByMe: next.isLikedByMe, likeCount: next.likeCount } : p,
      ),
    );
  };

  const WeeklyLike =
    category === 'discussion' ? (
      <WeeklyLikeList posts={topPosts} onToggleLike={handleTopToggleLike} />
    ) : category === 'media' ? (
      <WeeklyLikeCards posts={topPosts} onToggleLike={handleTopToggleLike} />
    ) : (
      <WeeklyLikeText posts={topPosts} onToggleLike={handleTopToggleLike} />
    );

  return (
    <div className="space-y-8 animate-fadeIn">
      <h1 className="text-4xl font-black text-green-950">{categoryName}</h1>

      {topPosts.length > 0 ? WeeklyLike : null}

      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="text-lg font-bold text-gray-800">全部帖子</div>
        <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1">
          <button
            type="button"
            onClick={() => setSort('latest')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              sort === 'latest' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            最新
          </button>
          <button
            type="button"
            onClick={() => setSort('hot')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              sort === 'hot' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            最热
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {initialLoading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400 font-medium">
          {categoryName}还没有帖子，快来发第一个吧
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onChange={handlePostChange} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-8" />

      {loading && !initialLoading && (
        <div className="flex justify-center py-6 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      )}

      <PostComposer
        category={category}
        onPosted={() => {
          // 发完帖回到第一页刷新
          fetchPage(1, sort, true);
          getCategoryTop(category, 3)
            .then((res) => setTopPosts(res.posts))
            .catch(() => {});
        }}
      />
    </div>
  );
};

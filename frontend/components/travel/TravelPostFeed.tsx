import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { type FeedPost, getCategoryFeed } from '../../services/feedService';
import { PostCard } from '../PostCard';
import { PostComposer } from '../PostComposer';

type FilterKey = 'all' | '梓渝' | '田栩宁';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: '梓渝', label: '梓渝' },
  { key: '田栩宁', label: '田栩宁' },
];

const PAGE_SIZE = 20;

export const TravelPostFeed: React.FC = () => {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);

  const fetchPage = useCallback(async (nextPage: number, replace: boolean) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await getCategoryFeed('travel', nextPage, PAGE_SIZE, 'latest');
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
  }, []);

  useEffect(() => {
    setInitialLoading(true);
    setPosts([]);
    setHasMore(false);
    setPage(1);
    fetchPage(1, true);
  }, [fetchPage]);

  // 无限滚动
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          fetchPage(page + 1, false);
        }
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchPage]);

  // 前端按 hashtags/正文里是否包含明星名过滤
  const visiblePosts = useMemo(() => {
    if (filter === 'all') return posts;
    const keyword = filter;
    return posts.filter((p) => {
      const inTags = Array.isArray(p.hashtags) && p.hashtags.some((t) => t.includes(keyword));
      const inTitle = p.title?.includes(keyword);
      const inContent = p.content?.includes(keyword);
      return inTags || inTitle || inContent;
    });
  }, [posts, filter]);

  const handlePostChange = (next: FeedPost) => {
    setPosts((prev) => prev.map((p) => (p.id === next.id ? next : p)));
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-green-950">📷 粉丝游记</h2>
          <p className="text-sm text-gray-500 font-medium">最近打卡</p>
        </div>

        <div className="flex items-center gap-1 bg-white rounded-full p-1 border border-green-50 self-start">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filter === f.key
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-green-700'
              }`}
            >
              {f.label}
            </button>
          ))}
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
      ) : visiblePosts.length === 0 ? (
        <div className="text-center py-20 text-gray-400 font-medium">
          还没有游记，快来发第一篇吧
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
          {visiblePosts.map((post) => (
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
        category="travel"
        placeholder="分享你的游记…支持 #梓渝 #田栩宁 等话题"
        onPosted={() => fetchPage(1, true)}
      />
    </section>
  );
};

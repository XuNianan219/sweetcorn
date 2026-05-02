// 首页 Feed 流：顶部推荐/关注两个 tab，下面瀑布流 + 无限滚动
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PostCard } from '../components/PostCard';
import {
  type FeedPost,
  type FeedResponse,
  getDiscoverFeed,
  getFollowingFeed,
} from '../services/feedService';

type Tab = 'discover' | 'following';

const PAGE_SIZE = 12;

export const Home: React.FC = () => {
  const [tab, setTab] = useState<Tab>('discover');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // 用 requestId 防止 tab 切换 / 快速滚动造成的响应竞态
  const requestIdRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(
    async (nextTab: Tab, nextPage: number, reset: boolean) => {
      const myRequestId = ++requestIdRef.current;
      setLoading(true);
      if (reset) setError(null);
      try {
        const res: FeedResponse =
          nextTab === 'following'
            ? await getFollowingFeed(nextPage, PAGE_SIZE)
            : await getDiscoverFeed(nextPage, PAGE_SIZE);
        if (myRequestId !== requestIdRef.current) return; // 过期响应丢弃
        setPosts((prev) => (reset ? res.posts : [...prev, ...res.posts]));
        setPage(nextPage);
        setHasMore(res.hasMore);
      } catch (err) {
        if (myRequestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        if (myRequestId === requestIdRef.current) {
          setLoading(false);
          setInitialLoaded(true);
        }
      }
    },
    [],
  );

  // tab 切换时重置并重新拉第一页
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setInitialLoaded(false);
    fetchPage(tab, 1, true);
  }, [tab, fetchPage]);

  // IntersectionObserver 监听到底 → 自动加载下一页
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        if (loading || !hasMore) return;
        fetchPage(tab, page + 1, false);
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loading, hasMore, page, tab, fetchPage]);

  const replacePost = useCallback((next: FeedPost) => {
    setPosts((prev) => prev.map((p) => (p.id === next.id ? next : p)));
  }, []);

  const isEmptyFollowing =
    tab === 'following' && initialLoaded && !loading && !error && posts.length === 0;

  return (
    <div className="animate-fadeIn">
      {/* 顶部 tab */}
      <div className="sticky top-16 z-30 bg-[#fcf9e8]/90 backdrop-blur-sm -mx-4 px-4 py-3 mb-4 flex items-center justify-center gap-2">
        <TabButton active={tab === 'discover'} onClick={() => setTab('discover')}>
          推荐
        </TabButton>
        <TabButton active={tab === 'following'} onClick={() => setTab('following')}>
          关注
        </TabButton>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchPage(tab, 1, true)}
            className="ml-3 underline font-bold hover:text-red-800"
          >
            重试
          </button>
        </div>
      )}

      {isEmptyFollowing ? (
        <EmptyFollowing onSwitch={() => setTab('discover')} />
      ) : (
        <>
          {/* 瀑布流：手机 2 列 / 平板 3 列 / 桌面 4 列 */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onChange={replacePost} />
            ))}
          </div>

          {/* 无限滚动哨兵 + 底部状态 */}
          <div ref={sentinelRef} className="h-10" />
          <div className="text-center py-6 text-sm text-gray-400">
            {loading
              ? '加载中...'
              : !hasMore && posts.length > 0
              ? '没有更多了 🌽'
              : !loading && !hasMore && posts.length === 0 && tab === 'discover'
              ? '还没有任何帖子'
              : ''}
          </div>
        </>
      )}
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all ${
      active
        ? 'bg-green-600 text-white shadow-sm'
        : 'bg-white text-gray-500 border border-gray-200 hover:text-green-600'
    }`}
  >
    {children}
  </button>
);

const EmptyFollowing: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-20 h-20 rounded-full gradient-ningyuzhi mb-4 flex items-center justify-center text-3xl">
      🌽
    </div>
    <p className="text-gray-700 font-bold mb-1">还没关注任何人</p>
    <p className="text-gray-400 text-sm mb-4">去推荐看看吧</p>
    <button
      onClick={onSwitch}
      className="px-6 py-2 rounded-full gradient-ningyuzhi text-green-900 font-bold shadow-sm hover:shadow-md transition-shadow"
    >
      去推荐
    </button>
  </div>
);

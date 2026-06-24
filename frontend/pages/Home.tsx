// 首页 Feed 流：推荐/关注两个 tab，混排「帖子 + 商品」瀑布流 + 类型角标 + 无限滚动
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PostCard } from '../components/PostCard';
import { ProductCard } from '../components/merchandise/ProductCard';
import { PostFeedSkeleton } from '../components/skeletons/PostCardSkeleton';
import { PullToRefreshWrapper } from '../components/PullToRefreshWrapper';
import {
  type FeedItem,
  type FeedPost,
  type FeedProduct,
  type MixedFeedResponse,
  getDiscoverFeed,
  getFollowingFeed,
} from '../services/feedService';
import { type Product } from '../services/merchandiseService';
import { useLang } from '../contexts/LanguageContext';

type Tab = 'discover' | 'following';

const PAGE_SIZE = 12;

// 类型角标（统一卡片 + 小角标，避免审美疲劳）
function typeBadge(item: FeedItem, en: boolean): string {
  if (item.kind === 'product') return en ? '¥ Item' : '¥ 商品';
  if ((item as FeedPost).mediaType === 'video') return en ? '▶ Video' : '▶ 视频';
  return en ? 'Post' : '图文';
}

export const Home: React.FC = () => {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<Tab>('discover');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const requestIdRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(
    async (nextTab: Tab, nextPage: number, reset: boolean) => {
      const myRequestId = ++requestIdRef.current;
      setLoading(true);
      if (reset) setError(null);
      try {
        const res: MixedFeedResponse =
          nextTab === 'following'
            ? await getFollowingFeed(nextPage, PAGE_SIZE)
            : await getDiscoverFeed(nextPage, PAGE_SIZE);
        if (myRequestId !== requestIdRef.current) return;
        setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
        setPage(nextPage);
        setHasMore(res.hasMore);
      } catch (err) {
        if (myRequestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : t('加载失败', 'Failed to load'));
      } finally {
        if (myRequestId === requestIdRef.current) {
          setLoading(false);
          setInitialLoaded(true);
        }
      }
    },
    [],
  );

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setInitialLoaded(false);
    fetchPage(tab, 1, true);
  }, [tab, fetchPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (loading || !hasMore) return;
        fetchPage(tab, page + 1, false);
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loading, hasMore, page, tab, fetchPage]);

  // 帖子点赞/变更：替换对应 post item（商品卡无需）
  const replacePost = useCallback((next: FeedPost) => {
    setItems((prev) => prev.map((it) => (it.kind !== 'product' && it.id === next.id ? next : it)));
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchPage(tab, 1, true);
  }, [fetchPage, tab]);

  const isEmptyFollowing =
    tab === 'following' && initialLoaded && !loading && !error && items.length === 0;

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
    <div className="animate-fadeIn">
      {/* 顶部 tab */}
      <div className="sticky top-16 z-30 bg-[#fcf9e8]/90 backdrop-blur-sm -mx-4 px-4 py-3 mb-4 flex items-center justify-center gap-2">
        <TabButton active={tab === 'discover'} onClick={() => setTab('discover')}>
          {t('推荐', 'Recommend')}
        </TabButton>
        <TabButton active={tab === 'following'} onClick={() => setTab('following')}>
          {t('关注', 'Following')}
        </TabButton>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchPage(tab, 1, true)} className="ml-3 underline font-bold hover:text-red-800">
            {t('重试', 'Retry')}
          </button>
        </div>
      )}

      {!initialLoaded && loading && items.length === 0 ? (
        <PostFeedSkeleton count={12} />
      ) : isEmptyFollowing ? (
        <EmptyFollowing onSwitch={() => setTab('discover')} />
      ) : (
        <>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4">
            {items.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="break-inside-avoid">
                {item.kind === 'product' ? (
                  <ProductCard product={productFrom(item)} typeBadge={typeBadge(item, lang === 'en')} />
                ) : (
                  <PostCard post={item} onChange={replacePost} typeBadge={typeBadge(item, lang === 'en')} />
                )}
              </div>
            ))}
          </div>

          <div ref={sentinelRef} className="h-10" />
          <div className="text-center py-6 text-sm text-gray-400">
            {loading
              ? t('加载中...', 'Loading...')
              : !hasMore && items.length > 0
              ? t('没有更多了 🌽', 'No more 🌽')
              : !loading && !hasMore && items.length === 0 && tab === 'discover'
              ? t('还没有任何内容', 'Nothing here yet')
              : ''}
          </div>
        </>
      )}
    </div>
    </PullToRefreshWrapper>
  );
};

// FeedProduct → ProductCard 需要的 Product 形状
function productFrom(p: FeedProduct): Product {
  return {
    id: p.id,
    name: p.name,
    description: '',
    price: p.price,
    imageUrls: p.imageUrls,
    videoUrl: p.videoUrl,
    wantCount: p.wantCount,
    sellerId: p.seller?.id ?? null,
    seller: p.seller ? { ...p.seller, bio: '' } : null,
    createdAt: p.createdAt,
  };
}

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

const EmptyFollowing: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full gradient-ningyuzhi mb-4 flex items-center justify-center text-3xl">
        🌽
      </div>
      <p className="text-gray-700 font-bold mb-1">{t('还没关注任何人', 'Not following anyone yet')}</p>
      <p className="text-gray-400 text-sm mb-4">{t('去推荐看看吧', 'Check out Recommend')}</p>
      <button
        onClick={onSwitch}
        className="px-6 py-2 rounded-full gradient-ningyuzhi text-green-900 font-bold shadow-sm hover:shadow-md transition-shadow"
      >
        {t('去推荐', 'Go to Recommend')}
      </button>
    </div>
  );
};

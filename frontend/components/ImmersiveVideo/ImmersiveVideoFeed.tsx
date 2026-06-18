import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { type FeedPost, toggleLike } from '../../services/feedService';
import { getMediaVideos } from '../../services/mediaVideoService';
import { VideoPlayer } from './VideoPlayer';
import { VideoOverlay } from './VideoOverlay';
import { VideoActionBar } from './VideoActionBar';
import { CommentDrawer } from './CommentDrawer';
import { ShareMenu } from './ShareMenu';

interface ImmersiveVideoFeedProps {
  onExit: () => void;
}

const PAGE_SIZE = 10;
const MUTE_KEY = 'sweetcorn_video_muted';

export const ImmersiveVideoFeed: React.FC<ImmersiveVideoFeedProps> = ({ onExit }) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // 静音状态，持久化到 localStorage（默认静音以满足浏览器自动播放策略）
  const [muted, setMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem(MUTE_KEY);
    return saved === null ? true : saved === 'true';
  });

  // 评论抽屉 / 分享菜单开关
  const [commentOpen, setCommentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const overlayOpen = commentOpen || shareOpen;

  const wheelLock = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const indexRef = useRef(0);
  const postsLenRef = useRef(0);
  const overlayOpenRef = useRef(false);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    postsLenRef.current = posts.length;
  }, [posts.length]);
  useEffect(() => {
    overlayOpenRef.current = overlayOpen;
  }, [overlayOpen]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem(MUTE_KEY, String(next));
      return next;
    });
  }, []);

  // 初次加载
  useEffect(() => {
    let cancelled = false;
    getMediaVideos(1, PAGE_SIZE)
      .then((res) => {
        if (cancelled) return;
        setPosts(res.posts);
        setHasMore(res.hasMore);
        setPage(1);
      })
      .catch((e) => !cancelled && setError(e?.message || '加载失败'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // 进入时锁定 body / html 滚动（含横向），退出恢复
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    getMediaVideos(page + 1, PAGE_SIZE)
      .then((res) => {
        setPosts((prev) => [...prev, ...res.posts]);
        setHasMore(res.hasMore);
        setPage((p) => p + 1);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page]);

  // 切换到下一条/上一条
  const goTo = useCallback(
    (next: number) => {
      const len = postsLenRef.current;
      if (next < 0 || next >= len) return;
      setCurrentIndex(next);
      // 接近末尾时预加载下一页
      if (next >= len - 2) loadMore();
    },
    [loadMore],
  );

  const goNext = useCallback(() => goTo(indexRef.current + 1), [goTo]);
  const goPrev = useCallback(() => goTo(indexRef.current - 1), [goTo]);

  // 点赞（乐观更新；双击只点不取消，点赞按钮可 toggle）
  const handleLike = useCallback(async (postId: string, forceLikeOnly: boolean) => {
    let prevState: FeedPost | undefined;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        prevState = p;
        if (forceLikeOnly && p.isLikedByMe) return p; // 双击已赞则不变
        return {
          ...p,
          isLikedByMe: !p.isLikedByMe,
          likeCount: p.likeCount + (p.isLikedByMe ? -1 : 1),
        };
      }),
    );
    if (forceLikeOnly && prevState?.isLikedByMe) return; // 无需请求
    try {
      const res = await toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isLikedByMe: res.liked, likeCount: res.likeCount } : p)),
      );
    } catch {
      // 回滚
      if (prevState) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? (prevState as FeedPost) : p)));
      }
    }
  }, []);

  // 滚轮（桌面，500ms 节流）
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (overlayOpenRef.current) return; // 抽屉/菜单打开时禁用切换
      if (wheelLock.current) return;
      if (Math.abs(e.deltaY) < 10) return;
      wheelLock.current = true;
      if (e.deltaY > 0) goNext();
      else goPrev();
      setTimeout(() => {
        wheelLock.current = false;
      }, 500);
    },
    [goNext, goPrev],
  );

  // 触摸（手机/平板）
  const handleTouchStart = (e: React.TouchEvent) => {
    if (overlayOpenRef.current) return;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (overlayOpenRef.current) return;
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > 50) {
      if (dy < 0) goNext();
      else goPrev();
    }
    touchStartY.current = null;
  };

  // 键盘（桌面）：上下切换、空格播放/暂停、Esc 退出
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // 抽屉/菜单打开时：Esc 先关抽屉，其余按键不切换视频
      if (overlayOpenRef.current) {
        if (e.key === 'Escape') {
          setCommentOpen(false);
          setShareOpen(false);
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        onExit();
      } else if (e.key === ' ') {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('immersive-toggle-play'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onExit]);

  const preloadFor = (idx: number): 'auto' | 'metadata' | 'none' => {
    if (idx === currentIndex) return 'auto';
    if (Math.abs(idx - currentIndex) === 1) return 'metadata';
    return 'none';
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black overflow-hidden select-none"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 返回按钮 */}
      <button
        onClick={onExit}
        style={{
          top: 'calc(1rem + env(safe-area-inset-top))',
          left: 'calc(1rem + env(safe-area-inset-left))',
        }}
        className="absolute z-30 w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors"
        title="返回瀑布流"
      >
        <ArrowLeft size={22} />
      </button>

      {loading ? (
        <div className="w-full h-full flex items-center justify-center text-white/70">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : error ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/80 px-6 text-center">
          <p className="font-medium">{error}</p>
          <button onClick={onExit} className="px-5 py-2.5 bg-white/20 rounded-2xl font-bold">
            返回
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/80 px-6 text-center">
          <p className="font-medium">嗑学影像还没有视频，去发一条带视频的帖子吧</p>
          <button onClick={onExit} className="px-5 py-2.5 bg-white/20 rounded-2xl font-bold">
            返回
          </button>
        </div>
      ) : (
        <>
          {/* 垂直滑动容器 */}
          <div
            className="absolute inset-0 transition-transform duration-300 ease-out"
            style={{ transform: `translateY(-${currentIndex * 100}%)` }}
          >
            {posts.map((post, idx) => {
              const near = Math.abs(idx - currentIndex) <= 1; // 仅渲染前后各一个的播放器
              return (
                <div key={post.id} className="absolute inset-x-0 h-full" style={{ top: `${idx * 100}%` }}>
                  {near ? (
                    <div className="relative w-full h-full max-w-[480px] mx-auto">
                      <VideoPlayer
                        post={post}
                        isActive={idx === currentIndex}
                        muted={muted}
                        onToggleMute={toggleMute}
                        onLike={() => handleLike(post.id, true)}
                        preload={preloadFor(idx)}
                      />
                      <VideoOverlay post={post} />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-black" />
                  )}
                </div>
              );
            })}
          </div>

          {/* 当前视频右侧操作栏（固定，不随滑动） */}
          {posts[currentIndex] && (
            <VideoActionBar
              post={posts[currentIndex]}
              onLike={() => handleLike(posts[currentIndex].id, false)}
              onCommentClick={() => setCommentOpen(true)}
              onShareClick={() => setShareOpen(true)}
            />
          )}

          {/* 进度指示 */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs font-bold">
            {currentIndex + 1} / {posts.length}
            {loadingMore && <Loader2 size={12} className="animate-spin inline ml-1.5 -mt-0.5" />}
          </div>

          {/* 评论抽屉 / 分享菜单（portal 到 body，z 高于一切） */}
          {posts[currentIndex] && (
            <>
              <CommentDrawer
                post={posts[currentIndex]}
                open={commentOpen}
                onClose={() => setCommentOpen(false)}
              />
              <ShareMenu
                post={posts[currentIndex]}
                open={shareOpen}
                onClose={() => setShareOpen(false)}
              />
            </>
          )}
        </>
      )}
    </div>,
    document.body,
  );
};

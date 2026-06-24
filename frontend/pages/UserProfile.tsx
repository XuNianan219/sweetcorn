import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, MessageCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { PostCard } from '../components/PostCard';
import { PostFeedSkeleton } from '../components/skeletons/PostCardSkeleton';
import { getUserPublic, getUserPosts, type PublicUser } from '../services/userService';
import { toggleFollow } from '../services/followService';
import { type FeedPost } from '../services/feedService';
import { useCurrentUser } from '../contexts/UserContext';
import { useLang } from '../contexts/LanguageContext';
import { showInfo } from '../utils/toast';

const PAGE_SIZE = 20;

export const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useCurrentUser();
  const { t } = useLang();

  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const isSelf = isLoggedIn && !!profile && user?.id === profile.id;

  // 加载公开资料
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    getUserPublic(userId)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setFollowing(p.isFollowedByMe);
      })
      .catch((e) => !cancelled && setError(e?.message || '加载失败'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 加载帖子
  const loadPosts = useCallback(
    async (nextPage: number, replace: boolean) => {
      if (!userId) return;
      if (replace) setPostsLoading(true);
      else setLoadingMore(true);
      try {
        const res = await getUserPosts(userId, nextPage, PAGE_SIZE);
        setPosts((prev) => (replace ? res.posts : [...prev, ...res.posts]));
        setHasMore(res.hasMore);
        setPage(nextPage);
      } catch {
        /* 错误已由 apiClient toast */
      } finally {
        setPostsLoading(false);
        setLoadingMore(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    loadPosts(1, true);
  }, [loadPosts]);

  // 无限滚动
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !postsLoading) {
          loadPosts(page + 1, false);
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, loadingMore, postsLoading, page, loadPosts]);

  const handleFollow = async () => {
    if (!isLoggedIn) {
      showInfo(t('请先登录', 'Please log in first'));
      navigate('/login');
      return;
    }
    if (!profile || followBusy) return;
    setFollowBusy(true);
    const prev = following;
    setFollowing(!prev);
    setProfile((p) => (p ? { ...p, followersCount: p.followersCount + (prev ? -1 : 1) } : p));
    try {
      const r = await toggleFollow(profile.id);
      setFollowing(r.following);
      setProfile((p) => (p ? { ...p, followersCount: r.followerCount } : p));
    } catch {
      setFollowing(prev);
      setProfile((p) => (p ? { ...p, followersCount: p.followersCount + (prev ? 1 : -1) } : p));
    } finally {
      setFollowBusy(false);
    }
  };

  const handleMessage = () => {
    if (!isLoggedIn) {
      showInfo(t('请先登录', 'Please log in first'));
      navigate('/login');
      return;
    }
    if (profile) navigate(`/messages/${profile.id}`);
  };

  const replacePost = (next: FeedPost) =>
    setPosts((prev) => prev.map((p) => (p.id === next.id ? next : p)));

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto pb-20 animate-pulse">
        <div className="h-40 bg-gray-100 rounded-[2rem] mb-6" />
        <PostFeedSkeleton count={6} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <p className="text-gray-500 font-medium">{error || t('用户不存在', 'User not found')}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 gradient-ningyuzhi text-green-950 font-black rounded-2xl">
          {t('返回', 'Back')}
        </button>
      </div>
    );
  }

  const isAvatarUrl = !!profile.avatarUrl && /^https?:\/\//.test(profile.avatarUrl);

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-16 animate-fadeIn">
      <PageHeader />

      {/* 头像 + 资料区（淡黄渐变背景，抖音式：头像在左，昵称/签名/按钮在右） */}
      <div className="gradient-ningyuzhi rounded-[2rem] p-6 md:p-8 text-green-950 shadow-sm">
        <div className="flex items-start gap-4 md:gap-5">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/70 shadow-inner overflow-hidden flex items-center justify-center text-4xl md:text-5xl shrink-0">
            {isAvatarUrl ? (
              <img src={profile.avatarUrl!} alt={profile.nickname || ''} className="w-full h-full object-cover" />
            ) : (
              <span>🌽</span>
            )}
          </div>

          <div className="flex-grow min-w-0">
            <h1 className="text-lg md:text-2xl font-black truncate">{profile.nickname || t('玉米成员', 'Corn member')}</h1>
            <p className="mt-1 text-sm font-medium opacity-75 line-clamp-2">
              {profile.bio?.trim() || t('这个人很懒，什么都没留下~', 'This corn left no bio yet~')}
            </p>

            <div className="flex items-center gap-2 mt-3">
              {isSelf ? (
                <button
                  onClick={() => navigate('/profile')}
                  className="px-5 py-1.5 rounded-full text-sm font-bold border border-green-700/40 text-green-800 bg-white/60 hover:bg-white transition-colors"
                >
                  {t('编辑资料', 'Edit profile')}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    disabled={followBusy}
                    className={`px-5 py-1.5 rounded-full text-sm font-bold transition-colors disabled:opacity-60 ${
                      following
                        ? 'border border-green-300 text-green-700 bg-white hover:bg-green-50'
                        : 'bg-green-700 text-white hover:bg-green-800'
                    }`}
                  >
                    {following ? t('已关注', 'Following') : t('+ 关注', '+ Follow')}
                  </button>
                  <button
                    onClick={handleMessage}
                    className="flex items-center gap-1 px-5 py-1.5 rounded-full text-sm font-bold border border-green-700/40 text-green-800 bg-white/60 hover:bg-white transition-colors"
                  >
                    <MessageCircle size={15} />
                    {t('私信', 'Message')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 统计 */}
        <div className="flex items-center justify-around md:justify-center md:gap-16 mt-5 pt-5 border-t border-white/40">
          <Stat value={profile.postsCount} label={t('帖子', 'Posts')} />
          <Stat value={profile.followersCount} label={t('粉丝', 'Followers')} />
          <Stat value={profile.followingCount} label={t('关注', 'Following')} />
        </div>
      </div>

      {/* TA 的帖子 */}
      <h2 className="text-base md:text-lg font-black text-green-950 mt-6 mb-3">{t('TA 的帖子', 'Posts')}</h2>

      {postsLoading ? (
        <PostFeedSkeleton count={6} />
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400 font-medium">{t('还没有发布过帖子', 'No posts yet')}</div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onChange={replacePost} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-8" />
      {loadingMore && (
        <div className="flex justify-center py-4 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="text-center">
    <div className="text-xl md:text-2xl font-black leading-none">{value}</div>
    <div className="text-xs font-medium opacity-70 mt-1">{label}</div>
  </div>
);

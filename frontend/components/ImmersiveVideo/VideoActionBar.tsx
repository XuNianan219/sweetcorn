import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Heart, MessageCircle, Plus, Share2 } from 'lucide-react';
import type { FeedPost } from '../../services/feedService';
import { getFollowStatus, toggleFollow } from '../../services/followService';
import { useCurrentUser } from '../../contexts/UserContext';
import { useLang } from '../../contexts/LanguageContext';
import { showInfo } from '../../utils/toast';

interface VideoActionBarProps {
  post: FeedPost;
  onLike: () => void;
  onCommentClick: () => void;
  onShareClick: () => void;
}

const textShadow = { textShadow: '0 1px 4px rgba(0,0,0,0.6)' } as const;

export const VideoActionBar: React.FC<VideoActionBarProps> = ({
  post,
  onLike,
  onCommentClick,
  onShareClick,
}) => {
  const { user, isLoggedIn } = useCurrentUser();
  const { t } = useLang();
  const navigate = useNavigate();
  const authorId = post.author?.id;
  const isOwnVideo = !!authorId && authorId === user?.id;

  const [following, setFollowing] = useState(false);
  const [justFollowed, setJustFollowed] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const [likeBump, setLikeBump] = useState(false);

  const avatar = post.author?.avatarUrl || '';
  const isAvatarUrl = avatar && /^https?:\/\//.test(avatar);

  // 查询关注状态（登录且非自己的视频）
  useEffect(() => {
    let cancelled = false;
    setFollowing(false);
    setJustFollowed(false);
    if (isLoggedIn && authorId && !isOwnVideo) {
      getFollowStatus(authorId)
        .then((r) => !cancelled && setFollowing(r.following))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [authorId, isLoggedIn, isOwnVideo]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      showInfo(t('请先登录', 'Please log in first'));
      navigate('/login');
      return;
    }
    if (!authorId || followBusy) return;
    setFollowBusy(true);
    try {
      const r = await toggleFollow(authorId);
      setFollowing(r.following);
      if (r.following) {
        // 绿色对勾闪一下，2 秒后淡出消失
        setJustFollowed(true);
        setTimeout(() => setJustFollowed(false), 2000);
      }
    } catch {
      /* ignore */
    } finally {
      setFollowBusy(false);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikeBump(true);
    setTimeout(() => setLikeBump(false), 200);
    onLike();
  };

  const circle =
    'w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-colors';
  const iconCls = 'w-5 h-5 md:w-6 md:h-6';
  // 未关注且非自己视频时显示 +（未登录也显示，点击引导登录）
  const showFollowPlus = !isOwnVideo && !following && !!authorId;

  return (
    <div
      className="absolute z-30 right-2 bottom-20 md:right-4 md:bottom-24 lg:right-6 lg:bottom-28 flex flex-col items-center gap-4 md:gap-5"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* 作者头像 + 关注 */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (authorId) navigate(`/users/${authorId}`);
          }}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg"
        >
          {isAvatarUrl ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>🌽</span>
          )}
        </button>

        {showFollowPlus && (
          <button
            onClick={handleFollow}
            disabled={followBusy}
            aria-label={t('关注作者', 'Follow author')}
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 text-green-900 flex items-center justify-center shadow-md ring-2 ring-black/20 hover:scale-110 transition-transform disabled:opacity-60"
          >
            <Plus size={13} strokeWidth={3} />
          </button>
        )}
        {justFollowed && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md ring-2 ring-black/20 animate-likePop">
            <Check size={13} strokeWidth={3} />
          </span>
        )}
      </div>

      {/* 点赞 */}
      <button onClick={handleLike} className="flex flex-col items-center gap-1 text-white">
        <span className={circle}>
          <Heart
            className={`${iconCls} transition-transform duration-200 ${post.isLikedByMe ? 'text-red-500' : 'text-white'} ${
              likeBump ? 'scale-[1.3]' : 'scale-100'
            }`}
            fill={post.isLikedByMe ? 'currentColor' : 'none'}
          />
        </span>
        <span className="text-xs font-bold" style={textShadow}>
          {post.likeCount}
        </span>
      </button>

      {/* 评论 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCommentClick();
        }}
        className="flex flex-col items-center gap-1 text-white"
      >
        <span className={circle}>
          <MessageCircle className={iconCls} />
        </span>
        <span className="text-xs font-bold" style={textShadow}>
          {post.commentCount ?? 0}
        </span>
      </button>

      {/* 分享 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShareClick();
        }}
        className="flex flex-col items-center gap-1 text-white"
      >
        <span className={circle}>
          <Share2 className={iconCls} />
        </span>
        <span className="text-xs font-bold" style={textShadow}>
          {t('分享', 'Share')}
        </span>
      </button>
    </div>
  );
};

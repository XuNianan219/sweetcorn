import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { type FeedPost, getPost, toggleLike } from '../services/feedService';
import { trackPostEvent } from '../services/recommendationService';
import { timeAgo } from '../services/commentService';
import { getFollowStatus, toggleFollow } from '../services/followService';
import { getCategoryName } from '../constants/categories';
import { CommentSection } from '../components/comments/CommentSection';
import { ShareMenu } from '../components/ImmersiveVideo/ShareMenu';
import PageHeader from '../components/PageHeader';
import { LazyImage } from '../components/LazyImage';
import { useCurrentUser } from '../contexts/UserContext';
import { useLang } from '../contexts/LanguageContext';
import { geminiService } from '../services/gemini';
import { showInfo, showError } from '../utils/toast';

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useCurrentUser();
  const { lang, t } = useLang();

  // 帖子原文 / 英文切换
  const [showEn, setShowEn] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [trans, setTrans] = useState<{ title: string; content: string } | null>(null);

  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likeBusy, setLikeBusy] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const commentRef = useRef<HTMLDivElement | null>(null);

  const authorId = post?.author?.id;
  const isOwnPost = isLoggedIn && !!authorId && user?.id === authorId;

  // 登录且非自己的帖子 → 查询关注状态
  useEffect(() => {
    if (!isLoggedIn || !authorId || isOwnPost) {
      setFollowing(false);
      return;
    }
    let cancelled = false;
    getFollowStatus(authorId)
      .then((r) => !cancelled && setFollowing(r.following))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authorId, isLoggedIn, isOwnPost]);

  const handleFollow = async () => {
    if (!isLoggedIn) {
      showInfo('请先登录');
      navigate('/login');
      return;
    }
    if (!authorId || followBusy) return;
    setFollowBusy(true);
    const prev = following;
    setFollowing(!prev); // 乐观更新
    try {
      const r = await toggleFollow(authorId);
      setFollowing(r.following);
    } catch {
      setFollowing(prev); // 失败回滚（错误 toast 由 apiClient 统一处理）
    } finally {
      setFollowBusy(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getPost(id)
      .then((p) => !cancelled && setPost(p))
      .catch((e) => !cancelled && setError(e?.message || '加载失败'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // 软行为埋点：点开详情记 view（一次），离开时按停留秒数记 dwell
  const viewTracked = useRef(false);
  const videoHooked = useRef(false); // 视频过 5 秒钩子只发一次
  useEffect(() => {
    if (!post) return;
    if (!viewTracked.current) {
      viewTracked.current = true;
      trackPostEvent(post.id, 'view');
    }
    const enterAt = Date.now();
    const postId = post.id;
    return () => {
      const sec = Math.round((Date.now() - enterAt) / 1000);
      if (sec > 0) trackPostEvent(postId, 'dwell', sec);
    };
  }, [post?.id]);

  const handleLike = async () => {
    if (!post || likeBusy) return;
    setLikeBusy(true);
    const wasLiked = post.isLikedByMe;
    setPost({ ...post, isLikedByMe: !wasLiked, likeCount: post.likeCount + (wasLiked ? -1 : 1) });
    try {
      const res = await toggleLike(post.id);
      setPost((p) => (p ? { ...p, isLikedByMe: res.liked, likeCount: res.likeCount } : p));
    } catch {
      setPost((p) => (p ? { ...p, isLikedByMe: wasLiked, likeCount: p.likeCount + (wasLiked ? 1 : -1) } : p));
    } finally {
      setLikeBusy(false);
    }
  };

  const handleShowEnglish = async () => {
    setShowEn(true);
    if (trans || !post) return;
    setTranslating(true);
    try {
      const [tt, tc] = await Promise.all([
        post.title ? geminiService.translateToEnglish(post.title, { postId: post.id, field: 'title' }) : Promise.resolve(''),
        post.content ? geminiService.translateToEnglish(post.content, { postId: post.id, field: 'content' }) : Promise.resolve(''),
      ]);
      setTrans({ title: tt, content: tc });
    } catch {
      showError(t('翻译失败，请稍后再试', 'Translation failed, try again'));
      setShowEn(false);
    } finally {
      setTranslating(false);
    }
  };

  const scrollToComments = () => commentRef.current?.scrollIntoView({ behavior: 'smooth' });

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto pb-24 md:pb-12 animate-pulse">
        <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-28 bg-gray-100 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="h-6 w-2/3 bg-gray-100 rounded" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-5/6 bg-gray-100 rounded" />
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
          </div>
          <div className="h-60 w-full bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <p className="text-gray-500 font-medium">{error || '帖子不存在'}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 gradient-ningyuzhi text-green-950 font-black rounded-2xl">
          返回
        </button>
      </div>
    );
  }

  const images = post.mediaType === 'image' ? post.mediaUrls : [];
  const videoUrl = post.mediaType === 'video' ? post.mediaUrls[0] || post.mediaUrl : null;
  const nickname = post.author?.nickname || '匿名玉米';
  const avatar = post.author?.avatarUrl || '';
  const isAvatarUrl = avatar && /^https?:\/\//.test(avatar);

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-12 animate-fadeIn">
      <PageHeader />

      <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-6 md:p-8 space-y-5">
        {/* 作者卡片 */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => authorId && navigate(`/users/${authorId}`)}
            className="w-12 h-12 rounded-full bg-green-50 overflow-hidden flex items-center justify-center text-xl shrink-0 cursor-pointer"
          >
            {isAvatarUrl ? (
              <img src={avatar} alt={nickname} className="w-full h-full object-cover" />
            ) : (
              <span>🌽</span>
            )}
          </div>
          <div>
            <p
              onClick={() => authorId && navigate(`/users/${authorId}`)}
              className="font-black text-gray-800 cursor-pointer hover:text-green-600 transition-colors"
            >
              {nickname}
            </p>
            <p className="text-xs text-gray-400 font-medium">
              {timeAgo(post.createdAt)}
              {post.category && ` · ${getCategoryName(post.category)}`}
            </p>
          </div>

          {/* 关注作者：自己的帖子不显示 */}
          {authorId && !isOwnPost && (
            <button
              onClick={handleFollow}
              disabled={followBusy}
              className={`ml-auto shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-colors disabled:opacity-60 ${
                following
                  ? 'border border-green-300 text-green-700 bg-white hover:bg-green-50'
                  : 'bg-green-700 text-white hover:bg-green-800'
              }`}
            >
              {following ? '已关注' : '+ 关注'}
            </button>
          )}
        </div>

        {/* 英文模式下：原文 / English 切换 */}
        {lang === 'en' && (post.title || post.content) && (
          <div className="flex items-center gap-0.5 bg-gray-50 rounded-full p-0.5 w-fit text-xs font-bold">
            <button
              onClick={() => setShowEn(false)}
              className={`px-3 py-1 rounded-full transition-colors ${!showEn ? 'bg-green-600 text-white' : 'text-gray-500'}`}
            >
              Original
            </button>
            <button
              onClick={handleShowEnglish}
              disabled={translating}
              className={`px-3 py-1 rounded-full transition-colors disabled:opacity-60 ${showEn ? 'bg-green-600 text-white' : 'text-gray-500'}`}
            >
              {translating ? '…' : 'English'}
            </button>
          </div>
        )}

        {/* 标题 + 正文 */}
        {post.title && (
          <h1 className="text-2xl font-black text-green-950 leading-snug">
            {showEn && trans ? trans.title : post.title}
          </h1>
        )}
        {post.content && (
          <p className="text-[15px] text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
            {showEn && trans ? trans.content : post.content}
          </p>
        )}

        {/* 媒体 */}
        {videoUrl && (
          <video
            src={videoUrl}
            controls
            playsInline
            onTimeUpdate={(e) => {
              if (!videoHooked.current && e.currentTarget.currentTime >= 5) {
                videoHooked.current = true;
                trackPostEvent(post.id, 'video_5s');
              }
            }}
            onEnded={() => trackPostEvent(post.id, 'video_complete')}
            className="w-full rounded-2xl bg-black max-h-[70vh]"
          />
        )}
        {images.length === 1 && (
          <div className="rounded-2xl overflow-hidden">
            <LazyImage src={images[0]} alt="" className="w-full object-cover" />
          </div>
        )}
        {images.length > 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {images.map((url, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden">
                <LazyImage src={url} alt="" aspectRatio="1 / 1" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* 话题 */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.hashtags.map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* 互动栏 */}
        <div className="flex items-center gap-6 pt-3 border-t border-gray-50">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-red-500 transition-colors"
          >
            <Heart size={20} className={post.isLikedByMe ? 'text-red-500' : ''} fill={post.isLikedByMe ? 'currentColor' : 'none'} />
            {post.likeCount}
          </button>
          <button
            onClick={scrollToComments}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-green-600 transition-colors"
          >
            <MessageCircle size={20} />
            {post.commentCount}
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-green-600 transition-colors"
          >
            <Share2 size={20} />
            分享
          </button>
        </div>
      </div>

      {/* 分享弹窗（复用沉浸式视频的 ShareMenu） */}
      <ShareMenu post={post} open={shareOpen} onClose={() => setShareOpen(false)} />

      {/* 评论区 */}
      <div ref={commentRef} className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-6 md:p-8 mt-5">
        <CommentSection postId={post.id} />
      </div>
    </div>
  );
};

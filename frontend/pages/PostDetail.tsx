import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { type FeedPost, getPost, toggleLike } from '../services/feedService';
import { timeAgo } from '../services/commentService';
import { getCategoryName } from '../constants/categories';
import { CommentSection } from '../components/comments/CommentSection';
import PageHeader from '../components/PageHeader';
import { LazyImage } from '../components/LazyImage';

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likeBusy, setLikeBusy] = useState(false);
  const commentRef = useRef<HTMLDivElement | null>(null);

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
          <div className="w-12 h-12 rounded-full bg-green-50 overflow-hidden flex items-center justify-center text-xl shrink-0">
            {isAvatarUrl ? (
              <img src={avatar} alt={nickname} className="w-full h-full object-cover" />
            ) : (
              <span>🌽</span>
            )}
          </div>
          <div>
            <p className="font-black text-gray-800">{nickname}</p>
            <p className="text-xs text-gray-400 font-medium">
              {timeAgo(post.createdAt)}
              {post.category && ` · ${getCategoryName(post.category)}`}
            </p>
          </div>
        </div>

        {/* 标题 + 正文 */}
        {post.title && <h1 className="text-2xl font-black text-green-950 leading-snug">{post.title}</h1>}
        {post.content && (
          <p className="text-[15px] text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        )}

        {/* 媒体 */}
        {videoUrl && (
          <video src={videoUrl} controls playsInline className="w-full rounded-2xl bg-black max-h-[70vh]" />
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
          <button className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-green-600 transition-colors" title="分享（即将上线）">
            <Share2 size={20} />
            分享
          </button>
        </div>
      </div>

      {/* 评论区 */}
      <div ref={commentRef} className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-6 md:p-8 mt-5">
        <CommentSection postId={post.id} />
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, MessageCircle, Play, ShoppingCart, Store } from 'lucide-react';
import { getProduct, toggleProductLike, type Product } from '../services/merchandiseService';
import { addToCart } from '../services/cartService';
import { getFollowStatus, toggleFollow } from '../services/followService';
import { useCurrentUser } from '../contexts/UserContext';
import PageHeader from '../components/PageHeader';
import { LazyImage } from '../components/LazyImage';
import { ChatDrawer } from '../components/ChatDrawer';
import { showInfo, showSuccess } from '../utils/toast';
import { useLang } from '../contexts/LanguageContext';
import { useAutoTranslate } from '../hooks/useAutoTranslate';

export const MerchandiseProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useCurrentUser();
  const { t } = useLang();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 英文模式下显示商品名/描述的译文（命中数据库缓存则秒回）
  const tr = useAutoTranslate('product', product?.id, {
    name: product?.name || '',
    description: product?.description || '',
  });
  // 主展示：-1 表示宣传视频，>=0 表示对应样图
  const [activeIdx, setActiveIdx] = useState(0);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  // 聊天目标：卖家。null 表示关闭。
  const [chatTarget, setChatTarget] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
  // 点赞 & 购物车
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [addingCart, setAddingCart] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then((p) => {
        setProduct(p);
        setActiveIdx(p.videoUrl ? -1 : 0); // 有宣传视频则默认展示视频
        setLiked(!!p.isLikedByMe);
        setLikeCount(p.likeCount ?? 0);
      })
      .catch(() => setError(t('商品不存在', 'Product not found')))
      .finally(() => setLoading(false));
  }, [id]);

  const seller = product?.seller || null;
  const isSelfSeller = isLoggedIn && !!seller && user?.id === seller.id;

  useEffect(() => {
    if (!seller || !isLoggedIn || isSelfSeller) {
      setFollowing(false);
      return;
    }
    let cancelled = false;
    getFollowStatus(seller.id)
      .then((r) => !cancelled && setFollowing(r.following))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [seller, isLoggedIn, isSelfSeller]);

  const handleFollow = async () => {
    if (!isLoggedIn) {
      showInfo(t('请先登录', 'Please log in first'));
      navigate('/login');
      return;
    }
    if (!seller || followBusy) return;
    setFollowBusy(true);
    const prev = following;
    setFollowing(!prev);
    try {
      const r = await toggleFollow(seller.id);
      setFollowing(r.following);
    } catch {
      setFollowing(prev);
    } finally {
      setFollowBusy(false);
    }
  };

  const requireLogin = (): boolean => {
    if (isLoggedIn) return true;
    showInfo(t('请先登录', 'Please log in first'));
    navigate('/login');
    return false;
  };

  // 咨询客服 = 联系该商品的卖家（发布人）。仿淘宝：商品页客服即店铺/卖家本人。
  const handleContactSeller = () => {
    if (!requireLogin() || !seller || isSelfSeller) return;
    setChatTarget({ id: seller.id, name: seller.nickname || t('玉米店铺', 'Corn Shop'), avatar: seller.avatarUrl });
  };

  // 点赞 toggle（乐观更新，失败回滚）
  const handleToggleLike = async () => {
    if (!requireLogin() || !product || likeBusy) return;
    setLikeBusy(true);
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));
    try {
      const r = await toggleProductLike(product.id);
      setLiked(r.liked);
      setLikeCount(r.likeCount);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLikeBusy(false);
    }
  };

  // 加入购物车
  const handleAddToCart = async () => {
    if (!requireLogin() || !product || addingCart) return;
    setAddingCart(true);
    try {
      await addToCart(product.id, 1);
      showSuccess(t('已加入购物车', 'Added to cart'));
    } catch {
      /* 错误已由 apiClient toast */
    } finally {
      setAddingCart(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400 text-sm">{t('加载中...', 'Loading...')}</div>;
  }
  if (error || !product) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-gray-400 text-sm">{error ?? t('商品不存在', 'Product not found')}</p>
        <button onClick={() => navigate(-1)} className="text-green-600 underline text-sm">
          {t('返回', 'Back')}
        </button>
      </div>
    );
  }

  const sellerIsUrl = !!seller?.avatarUrl && /^https?:\/\//.test(seller.avatarUrl);
  const hasVideo = !!product.videoUrl;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-28">
      <PageHeader title={t('商品详情', 'Product')} />

      {/* 主展示区：宣传视频 / 样图 */}
      <div className="space-y-2">
        <div className="w-full rounded-2xl overflow-hidden bg-black aspect-square">
          {activeIdx === -1 && hasVideo ? (
            <video
              src={product.videoUrl}
              controls
              playsInline
              poster={product.imageUrls[0]}
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <img
              src={product.imageUrls[activeIdx] || product.imageUrls[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* 缩略图：视频在最前 + 各样图 */}
        {(hasVideo || product.imageUrls.length > 1) && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {hasVideo && (
              <button
                onClick={() => setActiveIdx(-1)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                  activeIdx === -1 ? 'border-green-500' : 'border-transparent'
                }`}
              >
                <img src={product.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                  <Play size={18} className="fill-current" />
                </span>
              </button>
            )}
            {product.imageUrls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                  activeIdx === idx ? 'border-green-500' : 'border-transparent'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 商品名 & 价格 */}
      <div className="space-y-2">
        <p className="font-bold text-green-700">
          <span className="text-base align-text-top">¥</span>
          <span className="text-3xl">{product.price}</span>
        </p>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 leading-snug">{tr.name}</h1>
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={handleToggleLike}
            disabled={likeBusy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-colors disabled:opacity-60 ${
              liked ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart size={15} className={liked ? 'fill-current' : ''} />
            <span>{likeCount > 0 ? likeCount : t('点赞', 'Like')}</span>
          </button>
          <span className="text-gray-400">{product.wantCount} {t('人想要', 'want this')}</span>
        </div>
      </div>

      {/* 商家卡片 */}
      {seller && (
        <div className="bg-white rounded-2xl border border-green-50 shadow-sm p-4 flex items-center gap-3">
          <button
            onClick={() => navigate(`/users/${seller.id}`)}
            className="w-12 h-12 rounded-full bg-green-50 overflow-hidden shrink-0 flex items-center justify-center text-2xl"
          >
            {sellerIsUrl ? (
              <img src={seller.avatarUrl!} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>🌽</span>
            )}
          </button>
          <button onClick={() => navigate(`/users/${seller.id}`)} className="flex-grow min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <Store size={14} className="text-green-600 shrink-0" />
              <span className="font-bold text-gray-800 truncate">{seller.nickname || t('玉米店铺', 'Corn Shop')}</span>
            </div>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {seller.bio?.trim() || t('甜玉米官方认证店铺', 'SweetCorn verified shop')}
            </p>
          </button>
          {!isSelfSeller && (
            <button
              onClick={handleFollow}
              disabled={followBusy}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors disabled:opacity-60 ${
                following
                  ? 'border border-green-300 text-green-700 bg-white'
                  : 'bg-green-700 text-white hover:bg-green-800'
              }`}
            >
              {following ? t('已关注', 'Following') : t('+ 关注', '+ Follow')}
            </button>
          )}
        </div>
      )}

      {/* 描述 */}
      {product.description && (
        <div className="bg-white rounded-2xl border border-green-50 shadow-sm p-4">
          <h2 className="text-sm font-bold text-gray-900 mb-2">{t('商品详情', 'Details')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {tr.description}
          </p>
        </div>
      )}

      {/* 底部操作栏（淘宝式：咨询卖家 + 加入购物车 + 想要） */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-yellow-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleContactSeller}
            disabled={!seller || isSelfSeller}
            className="flex flex-col items-center justify-center text-green-700 disabled:opacity-40 shrink-0"
            title={isSelfSeller ? t('这是你发布的商品', 'This is your own item') : undefined}
          >
            <MessageCircle size={20} />
            <span className="text-[11px] font-bold">{t('咨询卖家', 'Seller')}</span>
          </button>
          <button
            onClick={handleAddToCart}
            disabled={addingCart}
            className="flex-1 py-3 border-2 border-green-600 text-green-700 font-black rounded-2xl flex items-center justify-center gap-1.5 hover:bg-green-50 transition-colors disabled:opacity-60"
          >
            <ShoppingCart size={18} />
            {t('加入购物车', 'Add to cart')}
          </button>
          <button
            disabled
            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-black rounded-2xl shadow-sm disabled:opacity-60"
            title={t('下单功能即将上线', 'Ordering coming soon')}
          >
            {t('想要这个（即将上线）', 'Buy (soon)')}
          </button>
        </div>
      </div>

      {/* 就地聊天框：与卖家咨询（走 commerce，不受私信条数限制） */}
      {chatTarget && (
        <ChatDrawer
          open={!!chatTarget}
          onClose={() => setChatTarget(null)}
          userId={chatTarget.id}
          partnerName={chatTarget.name}
          partnerAvatar={chatTarget.avatar}
          kind="commerce"
        />
      )}
    </div>
  );
};

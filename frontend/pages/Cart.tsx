import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import {
  getCart,
  setCartQuantity,
  removeFromCart,
  type CartItem,
} from '../services/cartService';
import { useCurrentUser } from '../contexts/UserContext';
import { useLang } from '../contexts/LanguageContext';
import PageHeader from '../components/PageHeader';
import { showError } from '../utils/toast';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useCurrentUser();
  const { t } = useLang();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    getCart()
      .then((r) => setItems(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const totalPrice = items.reduce((sum, it) => sum + (it.product ? it.product.price * it.quantity : 0), 0);
  const totalCount = items.reduce((sum, it) => sum + it.quantity, 0);

  // 改数量（乐观更新，失败回滚）
  const changeQty = async (item: CartItem, next: number) => {
    if (next < 1 || next > 99 || busyId) return;
    const prev = item.quantity;
    setBusyId(item.productId);
    setItems((list) => list.map((it) => (it.productId === item.productId ? { ...it, quantity: next } : it)));
    try {
      await setCartQuantity(item.productId, next);
    } catch {
      setItems((list) => list.map((it) => (it.productId === item.productId ? { ...it, quantity: prev } : it)));
      showError(t('操作失败，请重试', 'Failed, please retry'));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: CartItem) => {
    if (busyId) return;
    setBusyId(item.productId);
    const snapshot = items;
    setItems((list) => list.filter((it) => it.productId !== item.productId));
    try {
      await removeFromCart(item.productId);
    } catch {
      setItems(snapshot);
    } finally {
      setBusyId(null);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <p className="text-gray-500 font-medium">{t('请先登录查看购物车', 'Log in to view your cart')}</p>
        <button onClick={() => navigate('/login')} className="px-6 py-3 gradient-ningyuzhi text-green-950 font-black rounded-2xl">
          {t('去登录', 'Log in')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-32 animate-fadeIn">
      <PageHeader title={t('购物车', 'Cart')} />

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400">
          <ShoppingCart size={44} className="mb-3" />
          <p className="font-bold text-gray-600 mb-1">{t('购物车是空的', 'Your cart is empty')}</p>
          <p className="text-sm mb-5">{t('去逛逛喜欢的周边吧~', 'Go find some merch you like~')}</p>
          <button onClick={() => navigate('/category/merchandise')} className="px-6 py-2.5 gradient-ningyuzhi text-green-950 font-black rounded-2xl">
            {t('去逛周边', 'Browse merch')}
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="bg-white rounded-2xl border border-green-50 shadow-sm p-3 flex items-center gap-3">
                <button
                  onClick={() => navigate(`/merchandise/product/${it.productId}`)}
                  className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0"
                >
                  {it.product?.imageUrl ? (
                    <img src={it.product.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-2xl">🌽</span>
                  )}
                </button>
                <div className="flex-grow min-w-0">
                  <p className="font-bold text-gray-900 truncate">{it.product?.name || t('商品已下架', 'Item removed')}</p>
                  <p className="text-green-700 font-black mt-1">
                    <span className="text-sm">¥</span>
                    <span className="text-lg">{it.product?.price ?? 0}</span>
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => changeQty(it, it.quantity - 1)}
                        disabled={busyId === it.productId || it.quantity <= 1}
                        className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center disabled:opacity-40 hover:bg-gray-200"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center font-bold text-gray-800">{it.quantity}</span>
                      <button
                        onClick={() => changeQty(it, it.quantity + 1)}
                        disabled={busyId === it.productId || it.quantity >= 99}
                        className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center disabled:opacity-40 hover:bg-gray-200"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => remove(it)}
                      disabled={busyId === it.productId}
                      className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center disabled:opacity-40"
                      aria-label={t('删除', 'Remove')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 底部结算栏 */}
          <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-yellow-100">
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
              <div className="flex-grow">
                <p className="text-xs text-gray-400 font-medium">{t('合计', 'Total')}（{totalCount}）</p>
                <p className="text-green-700 font-black">
                  <span className="text-sm">¥</span>
                  <span className="text-2xl">{totalPrice.toFixed(2)}</span>
                </p>
              </div>
              <button
                disabled
                title={t('结算功能即将上线', 'Checkout coming soon')}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-black rounded-2xl shadow-sm disabled:opacity-60"
              >
                {t('去结算（即将上线）', 'Checkout (soon)')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2, Store, Trash2 } from 'lucide-react';
import { getMyProducts, deleteProduct, type Product } from '../services/merchandiseService';
import { useLang } from '../contexts/LanguageContext';
import { showSuccess } from '../utils/toast';

// 「我发布的商品」——卖家在个人主页查看 / 下架自己上架的周边
export const MyProducts: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyProducts()
      .then((res) => !cancelled && setList(res))
      .catch(() => !cancelled && setList([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    setBusyId(id);
    const snapshot = list;
    setList((prev) => prev.filter((p) => p.id !== id));
    setConfirmId(null);
    try {
      await deleteProduct(id);
      showSuccess(t('已下架', 'Removed'));
    } catch {
      setList(snapshot); // 失败回滚
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Store size={22} />
          </span>
          <div>
            <h2 className="text-lg font-black text-green-950">{t('我发布的商品', 'My Products')}</h2>
            <p className="text-xs text-gray-400 font-medium">{t('我上架的周边，可查看或下架', 'Items I listed — view or remove')}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/merchandise/product/submit')}
          className="shrink-0 px-3 py-2 rounded-xl bg-green-700 text-yellow-300 text-sm font-black hover:bg-green-800 transition-colors"
        >
          {t('+ 上架', '+ List')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="py-10 text-center border-4 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/40 space-y-3">
          <p className="text-gray-400 font-bold">{t('你还没有上架过商品', 'You haven’t listed any products yet')}</p>
          <button
            onClick={() => navigate('/merchandise/product/submit')}
            className="px-5 py-2 rounded-xl bg-green-700 text-yellow-300 text-sm font-black hover:bg-green-800 transition-colors"
          >
            {t('去上架商品', 'List a product')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-green-50/40 border border-green-50"
            >
              <button
                onClick={() => navigate(`/merchandise/product/${p.id}`)}
                className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shrink-0"
              >
                {p.imageUrls?.[0] ? (
                  <img src={p.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-xl">🌽</span>
                )}
              </button>
              <button
                onClick={() => navigate(`/merchandise/product/${p.id}`)}
                className="flex-grow min-w-0 text-left"
              >
                <span className="block font-bold text-gray-800 truncate">{p.name}</span>
                <span className="flex items-center gap-2 text-xs text-gray-400 font-medium mt-0.5">
                  <span className="text-green-700 font-black">¥{p.price}</span>
                  <span className="flex items-center gap-0.5">
                    <Heart size={11} /> {p.likeCount ?? 0}
                  </span>
                </span>
              </button>

              {confirmId === p.id ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={busyId === p.id}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-black hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    {busyId === p.id && <Loader2 size={12} className="animate-spin" />}
                    {t('确认下架', 'Confirm')}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold hover:bg-gray-200"
                  >
                    {t('取消', 'Cancel')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(p.id)}
                  className="shrink-0 w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"
                  aria-label={t('下架', 'Remove')}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProducts;

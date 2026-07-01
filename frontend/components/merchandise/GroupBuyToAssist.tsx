import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock } from 'lucide-react';
import { getGroupBuyToAssist, trackEvent } from '../../services/recommendationService';
import { type Product } from '../../services/merchandiseService';
import { LazyImage } from '../LazyImage';

// 莫兰迪色：暖灰底 + 灰玫瑰强调
const ACCENT = '#b08d8d';
const ACCENT_BG = '#efe7e3';

function remainText(deadline?: string | null): string {
  if (!deadline) return '';
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return '即将截止';
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return '不到 1 小时';
  if (h < 24) return `剩 ${h} 小时`;
  return `剩 ${Math.floor(h / 24)} 天`;
}

const GroupBuyCard: React.FC<{ product: Product }> = ({ product }) => {
  const navigate = useNavigate();
  const target = product.targetCount || 0;
  const current = product.currentCount || 0;
  const ratio = target > 0 ? Math.min(1, current / target) : 0;
  const imageUrl = product.imageUrls[0] ?? '';

  const open = () => {
    trackEvent(product.id, 'click');
    navigate(`/merchandise/product/${product.id}`);
  };

  return (
    <div
      onClick={open}
      className="cursor-pointer flex gap-3 p-3 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow border border-[#ece5df]"
    >
      {imageUrl && (
        <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-50">
          <LazyImage src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <h3 className="text-sm font-semibold text-[#5c544a] line-clamp-1">{product.name}</h3>

        {/* 进度条 current/target */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-[#9a8f82] mb-1">
            <span className="flex items-center gap-1">
              <Users size={11} />
              已 {current}/{target} 人
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {remainText(product.deadline)}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: ACCENT_BG }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${ratio * 100}%`, background: ACCENT }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className="text-[#a86b6b] font-bold">
            <span className="text-xs align-text-top">¥</span>
            <span className="text-lg">{product.price}</span>
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              trackEvent(product.id, 'assist');
              navigate(`/merchandise/product/${product.id}`);
            }}
            className="px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: ACCENT }}
          >
            帮 TA 助力
          </button>
        </div>
      </div>
    </div>
  );
};

// 「即将成团 / 帮 TA 助力」板块
export const GroupBuyToAssist: React.FC<{ limit?: number }> = ({ limit = 8 }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getGroupBuyToAssist(limit)
      .then((list) => alive && setProducts(list))
      .catch(() => alive && setProducts([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [limit]);

  if (loading || products.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="px-1 mb-3 text-base font-bold text-[#6b6357]">🔥 即将成团 · 帮 TA 助力</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {products.map((p) => (
          <GroupBuyCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
};

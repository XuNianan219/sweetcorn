import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { type Product } from '../../services/merchandiseService';
import { LazyImage } from '../LazyImage';
import { useAutoTranslate } from '../../hooks/useAutoTranslate';

interface Props {
  product: Product;
  typeBadge?: string; // 首页流的类型角标（商品）；其它页面不传则不显示
}

// 类型角标样式（与帖子卡片一致）
const BADGE_CLS = 'px-2 py-0.5 rounded-full text-[10px] font-black bg-black/55 text-white';

export const ProductCard: React.FC<Props> = ({ product, typeBadge }) => {
  const navigate = useNavigate();
  const imageUrl = product.imageUrls[0] ?? '';
  const tr = useAutoTranslate('product', product.id, { name: product.name });

  return (
    <div
      onClick={() => navigate(`/merchandise/product/${product.id}`)}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 break-inside-avoid mb-3 md:mb-4 border border-gray-100"
    >
      {imageUrl && (
        <div className="relative w-full overflow-hidden bg-gray-50">
          {/* 有图：角标叠在封面左上角 */}
          {typeBadge ? (
            <span className={`absolute top-2 left-2 z-10 backdrop-blur-sm ${BADGE_CLS}`}>{typeBadge}</span>
          ) : null}
          <LazyImage
            src={imageUrl}
            alt={product.name}
            className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-4 space-y-2.5">
        <h3 className="text-sm md:text-base font-semibold text-gray-900 leading-snug line-clamp-2">
          {/* 无图：角标与名称同行，排在最前 */}
          {!imageUrl && typeBadge ? (
            <span className={`inline-block align-[1px] mr-1.5 ${BADGE_CLS}`}>{typeBadge}</span>
          ) : null}
          {tr.name}
        </h3>

        <div className="flex items-center justify-between">
          <span className="font-bold text-green-700">
            <span className="text-sm align-text-top">¥</span>
            <span className="text-xl">{product.price}</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 rounded-full px-2 py-0.5">
            <Heart size={12} />
            {product.wantCount}
          </span>
        </div>
      </div>
    </div>
  );
};

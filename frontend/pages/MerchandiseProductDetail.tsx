import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { getProduct, type Product } from '../services/merchandiseService';

export const MerchandiseProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then(setProduct)
      .catch(() => setError('商品不存在'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400 text-sm">加载中...</div>;
  }
  if (error || !product) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-gray-400 text-sm">{error ?? '商品不存在'}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-green-600 underline text-sm"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* 返回 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors"
      >
        <ArrowLeft size={16} /> 返回
      </button>

      {/* 图片 */}
      {product.imageUrls.length > 0 && (
        <div className="space-y-2">
          <div className="w-full rounded-2xl overflow-hidden bg-gray-100 aspect-square">
            <img
              src={product.imageUrls[currentImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                    currentImage === idx ? 'border-green-500' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 商品名 & 价格 */}
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-gray-900">{product.name}</h1>
        <p className="text-3xl font-black text-green-700">¥{product.price}</p>
        <div className="flex items-center gap-1 text-sm text-gray-400">
          <Heart size={14} />
          <span>{product.wantCount} 人想要</span>
        </div>
      </div>

      {/* 描述 */}
      {product.description && (
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {product.description}
          </p>
        </div>
      )}

      {/* 占位按钮 — 不做购买功能 */}
      <div className="space-y-2">
        <button
          disabled
          className="w-full py-4 bg-gray-200 text-gray-400 font-black text-base rounded-2xl cursor-not-allowed"
        >
          敬请期待
        </button>
        <p className="text-center text-xs text-gray-400">下单功能即将上线</p>
      </div>
    </div>
  );
};

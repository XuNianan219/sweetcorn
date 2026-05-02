import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { type Product } from '../../services/merchandiseService';

interface Props {
  product: Product;
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const navigate = useNavigate();
  const imageUrl = product.imageUrls[0] ?? '';

  return (
    <div
      onClick={() => navigate(`/merchandise/product/${product.id}`)}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow break-inside-avoid mb-4 border border-gray-100"
    >
      {imageUrl && (
        <div className="w-full overflow-hidden bg-gray-50">
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-3 space-y-2">
        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-black text-green-700">¥{product.price}</span>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Heart size={12} />
            <span>{product.wantCount} 想要</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import { Lightbulb, Package } from 'lucide-react';
import { MerchandiseBanner } from '../components/merchandise/MerchandiseBanner';
import { ProductCard } from '../components/merchandise/ProductCard';
import { IdeaCard } from '../components/merchandise/IdeaCard';
import { getIdeas, getProducts, type Idea, type Product } from '../services/merchandiseService';

export const Merchandise: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingIdeas, setLoadingIdeas] = useState(true);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoadingProducts(false));

    getIdeas(1, 20)
      .then((res) => setIdeas(res.ideas))
      .catch(() => {})
      .finally(() => setLoadingIdeas(false));
  }, []);

  const handleToggleWant = useCallback(
    (id: string, result: { wanted: boolean; wantCount: number }) => {
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === id
            ? { ...idea, isWantedByMe: result.wanted, wantCount: result.wantCount }
            : idea
        )
      );
    },
    []
  );

  return (
    <div className="space-y-10 pb-20">
      <MerchandiseBanner />

      {/* 已上架周边 */}
      <section>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Package size={20} className="text-green-600" />
            <h2 className="text-xl font-black text-gray-900">已上架周边</h2>
          </div>
          <p className="text-sm text-gray-400 ml-7">精选粉丝周边，限时供应</p>
        </div>

        {loadingProducts ? (
          <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            暂无商品，先来提交一个创意吧
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* 粉丝创意征集 */}
      <section>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={20} className="text-green-600" />
            <h2 className="text-xl font-black text-gray-900">粉丝创意征集</h2>
          </div>
          <p className="text-sm text-gray-400 ml-7">这些创意正在凑人数中，快来支持！</p>
        </div>

        {loadingIdeas ? (
          <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            暂无创意，先来提交一个创意吧
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onToggleWant={handleToggleWant} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import { Lightbulb, Package } from 'lucide-react';
import { MerchandiseBanner } from '../components/merchandise/MerchandiseBanner';
import { ProductCard } from '../components/merchandise/ProductCard';
import { IdeaCard } from '../components/merchandise/IdeaCard';
import { getIdeas, getProducts, type Idea, type Product } from '../services/merchandiseService';
import { PullToRefreshWrapper } from '../components/PullToRefreshWrapper';

type MerchTab = 'products' | 'ideas';

export const Merchandise: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [activeTab, setActiveTab] = useState<MerchTab>('products');

  const loadData = useCallback(async () => {
    const pProducts = getProducts()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoadingProducts(false));

    const pIdeas = getIdeas(1, 20)
      .then((res) => setIdeas(res.ideas))
      .catch(() => {})
      .finally(() => setLoadingIdeas(false));

    await Promise.all([pProducts, pIdeas]);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    <PullToRefreshWrapper onRefresh={loadData}>
    <div className="space-y-10 pb-24 md:pb-20">
      {/* 顶部 banner（含「提交创意」入口）：移动端仅在「粉丝创意征集」tab 显示，桌面端始终显示 */}
      <div className={`${activeTab === 'ideas' ? 'block' : 'hidden'} md:block`}>
        <MerchandiseBanner />
      </div>

      {/* 已上架周边：移动端仅当前 Tab 显示，桌面端始终显示 */}
      <section className={`${activeTab === 'products' ? 'block' : 'hidden'} md:block`}>
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
          <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* 粉丝创意征集：移动端仅当前 Tab 显示，桌面端始终显示 */}
      <section className={`${activeTab === 'ideas' ? 'block' : 'hidden'} md:block`}>
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
          <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onToggleWant={handleToggleWant} />
            ))}
          </div>
        )}
      </section>

      {/* 移动端底部分区导航：已上架周边 / 粉丝创意征集 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-[#E2F7C1] flex">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'products' ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          <Package size={20} />
          已上架周边
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ideas')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'ideas' ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          <Lightbulb size={20} />
          粉丝创意征集
        </button>
      </nav>
    </div>
    </PullToRefreshWrapper>
  );
};

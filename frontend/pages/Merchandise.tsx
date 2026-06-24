import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Package, Plus } from 'lucide-react';
import { MerchandiseBanner } from '../components/merchandise/MerchandiseBanner';
import { ProductCard } from '../components/merchandise/ProductCard';
import { IdeaCard } from '../components/merchandise/IdeaCard';
import { getIdeas, getProducts, type Idea, type Product } from '../services/merchandiseService';
import { PullToRefreshWrapper } from '../components/PullToRefreshWrapper';
import { useLang } from '../contexts/LanguageContext';

type MerchTab = 'products' | 'ideas';

export const Merchandise: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLang();
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
        <div className="mb-6 pb-3 border-b border-yellow-100 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package size={22} className="text-green-600" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{t('已上架周边', 'Merch on sale')}</h2>
            </div>
            <p className="text-sm text-gray-500 ml-8">{t('精选粉丝周边，限时供应', 'Curated fan merch, limited time')}</p>
          </div>
          <button
            onClick={() => navigate('/merchandise/product/submit')}
            className="shrink-0 inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200"
          >
            <Plus size={16} /> {t('上架商品', 'List item')}
          </button>
        </div>

        {loadingProducts ? (
          <div className="text-center py-12 text-gray-400 text-sm">{t('加载中...', 'Loading...')}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {t('暂无商品，先来提交一个创意吧', 'No products yet — submit an idea first')}
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
        <div className="mb-6 pb-3 border-b border-yellow-100">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={22} className="text-green-600" />
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{t('粉丝创意征集', 'Fan idea wall')}</h2>
          </div>
          <p className="text-sm text-gray-500 ml-8">{t('这些创意正在凑人数中，快来支持！', 'These ideas are gathering support — join in!')}</p>
        </div>

        {loadingIdeas ? (
          <div className="text-center py-12 text-gray-400 text-sm">{t('加载中...', 'Loading...')}</div>
        ) : ideas.length === 0 ? (
          <div className="py-16 text-center border-4 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/40 space-y-4">
            <Lightbulb size={44} className="mx-auto text-gray-200" />
            <div className="space-y-1">
              <p className="text-gray-500 font-black">{t('还没有上架的创意', 'No approved ideas yet')}</p>
              <p className="text-gray-400 text-sm font-medium">{t('提交你的设计，通过审核后即可上架众筹', 'Submit your design — it goes live for crowdfunding once approved')}</p>
            </div>
            <button
              onClick={() => navigate('/merchandise/submit')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-green-700 text-yellow-300 text-sm font-black rounded-xl hover:bg-green-800 transition-colors"
            >
              <Lightbulb size={16} /> {t('提交我的创意', 'Submit my idea')}
            </button>
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
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-bold transition-all duration-200 ${
            activeTab === 'products'
              ? 'text-green-700 bg-gradient-to-t from-green-50 to-transparent'
              : 'text-gray-400'
          }`}
        >
          <Package size={20} />
          {t('已上架周边', 'Merch')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ideas')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-bold transition-all duration-200 ${
            activeTab === 'ideas'
              ? 'text-green-700 bg-gradient-to-t from-green-50 to-transparent'
              : 'text-gray-400'
          }`}
        >
          <Lightbulb size={20} />
          {t('粉丝创意征集', 'Ideas')}
        </button>
      </nav>
    </div>
    </PullToRefreshWrapper>
  );
};


import React, { useState } from 'react';
import { ShoppingBag, ExternalLink, Sparkles } from 'lucide-react';

/**
 * ⚠️ 虚拟链接配置：管理员可在此统一修改跳转链接
 */
const BRAND_LINKS: Record<number, string> = {
  1: "https://www.example.com/brand-ziyu-skincare",
  2: "https://www.example.com/brand-tian-beverage",
  3: "https://www.example.com/magazine-ningyuzhi",
  4: "https://www.example.com/brand-ziyu-jewelry",
  5: "https://www.example.com/brand-tian-fashion",
  6: "https://www.example.com/brand-ningyuzhi-candy",
};

interface BrandDeal {
  id: number;
  celeb: '梓渝' | '田栩宁' | '双人';
  brand: string;
  type: string;
  image: string;
}

export const Commercial: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('全部');

  const brands: BrandDeal[] = [
    { id: 1, celeb: '梓渝', brand: '某高端护肤品牌', type: '全球代言人', image: 'https://picsum.photos/seed/brand1/600/400' },
    { id: 2, celeb: '田栩宁', brand: '某国民饮料品牌', type: '品牌大使', image: 'https://picsum.photos/seed/brand2/600/400' },
    { id: 3, celeb: '双人', brand: '某时尚杂志首刊', type: '封面人物', image: 'https://picsum.photos/seed/brand3/600/400' },
    { id: 4, celeb: '梓渝', brand: '奢华珠宝系列', type: '品牌挚友', image: 'https://picsum.photos/seed/brand4/600/400' },
    { id: 5, celeb: '田栩宁', brand: '运动潮流服饰', type: '代言人', image: 'https://picsum.photos/seed/brand5/600/400' },
    { id: 6, celeb: '双人', brand: '甜蜜糖果礼盒', type: '特别合作', image: 'https://picsum.photos/seed/brand6/600/400' },
  ];

  const categories = ['全部', '梓渝', '田栩宁', '双人'];

  const filteredBrands = activeCategory === '全部' 
    ? brands 
    : brands.filter(brand => brand.celeb === activeCategory);

  const handleSupportClick = (id: number) => {
    window.open(BRAND_LINKS[id] || "https://www.example.com", "_blank");
  };

  return (
    <div className="space-y-12 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-3xl font-black text-green-900 flex items-center gap-2">
          <ShoppingBag className="text-green-600" /> 商务区 · 品牌代言
        </h1>
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-green-50 self-start">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${
                activeCategory === cat ? 'gradient-ningyuzhi text-green-900 shadow-sm' : 'text-gray-400 hover:text-green-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredBrands.map(brand => (
          <div key={brand.id} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500">
            <div className="relative h-56 overflow-hidden">
              <img src={brand.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={brand.brand}/>
              <div className="absolute top-4 left-4">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg ${
                  brand.celeb === '梓渝' ? 'gradient-ziyu text-white' : brand.celeb === '田栩宁' ? 'gradient-tian text-gray-900' : 'gradient-redsea text-white'
                }`}>{brand.celeb}</span>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-green-600 font-bold"><Sparkles size={12} /> {brand.type}</div>
                <h3 className="text-2xl font-black text-gray-900 leading-tight">{brand.brand}</h3>
              </div>
              <button onClick={() => handleSupportClick(brand.id)} className="w-full py-4 bg-gray-50 text-gray-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-green-50 hover:text-green-900 transition-all border border-transparent hover:border-green-100">
                <ShoppingBag size={20} /> 支持同款 <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-[2.5rem] p-10 border border-green-100 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="w-20 h-20 rounded-2xl gradient-ningyuzhi flex items-center justify-center text-green-900 shadow-inner"><Sparkles size={32} /></div>
        <div className="flex-grow space-y-2 text-center md:text-left">
          <h3 className="text-2xl font-black text-gray-900">购买登记 & 积分奖励</h3>
          <p className="text-gray-500 font-medium italic">每一份记录都将累积为应援乐园的专属积分，见证热爱与陪伴。</p>
        </div>
        <button className="px-10 py-4 bg-gray-900 text-white font-black rounded-2xl hover:scale-105 transition-transform shadow-lg">立即登记</button>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Users, Flame, Sparkles, X, ShoppingBag, CreditCard, ClipboardList, Info, History, CheckCircle } from 'lucide-react';
import { MOCK_MERCH } from '../constants';

export const MerchCenter: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [viewHistory, setViewHistory] = useState(false);
  
  const navigate = useNavigate();

  // 登记表单状态
  const [formData, setFormData] = useState({
    type: '',
    quantity: 1,
    name: '',
    phone: ''
  });

  const categories = ['全部', '棉花娃娃', '亚克力', '纸类周边', '穿戴周边'];

  const filteredMerch = MOCK_MERCH.filter(item => {
    const matchesCat = activeCategory === '全部' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setShowRegisterModal(false);
      setFormData({ type: '', quantity: 1, name: '', phone: '' });
    }, 2000);
  };

  return (
    <div className="space-y-10 pb-20 animate-fadeIn">
      {/* Search & Tabs Header */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Package className="text-green-600" /> 饭制周边 · 应援商城
          </h1>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input 
              type="text" 
              placeholder="搜索心动的周边..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-4 focus:ring-green-100 font-medium text-sm transition-all"
            />
          </div>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-full text-sm font-black whitespace-nowrap transition-all ${
                activeCategory === cat 
                  ? 'gradient-ningyuzhi text-green-900 shadow-lg' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Merch Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredMerch.map(item => (
          <div 
            key={item.id} 
            onClick={() => navigate(`/merch/${item.id}`)}
            className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer border border-transparent hover:border-green-200"
          >
            <div className="relative aspect-square overflow-hidden bg-gray-50">
              <img 
                src={item.image} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                alt={item.title} 
              />
              <div className="absolute top-4 left-4">
                <span className="gradient-ningyuzhi text-green-900 text-[10px] font-black px-3 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                  <Flame size={12} className="text-red-500 fill-current" /> 拼团中
                </span>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <h3 className="font-black text-gray-900 text-sm line-clamp-2 leading-tight group-hover:text-green-700 transition-colors">
                {item.title}
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-black text-green-600">定金:¥</span>
                  <span className="text-xl font-black text-green-700">{item.deposit}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-gray-400">
                  <Users size={12} /> {item.currentJoined}人已买
                </div>
              </div>

              <div className="space-y-1">
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${(item.currentJoined / item.targetGoal) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Creative Banner */}
      <div className="gradient-ningyuzhi rounded-[3rem] p-10 text-green-950 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-3xl font-black">周边创意征集</h2>
          <p className="opacity-80 font-medium italic">你有绝佳的周边点子吗？上传你的设计稿，我们来帮你成团！</p>
        </div>
        <button className="px-12 py-5 bg-white text-green-900 font-black rounded-2xl hover:scale-105 transition-transform shadow-lg">
          我要投递设计
        </button>
      </div>

      {/* Points Entry Module */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-green-100 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="w-20 h-20 rounded-2xl gradient-ningyuzhi flex items-center justify-center text-green-900 shadow-inner">
          <Sparkles size={32} />
        </div>
        <div className="flex-grow space-y-2 text-center md:text-left">
          <h3 className="text-2xl font-black text-gray-900">购买登记 & 积分奖励</h3>
          <p className="text-gray-500 font-medium italic">每一份记录都将累积为应援乐园的专属积分，支持您在活动区参与应援和公益。</p>
        </div>
        <button 
          onClick={() => setShowRegisterModal(true)}
          className="px-10 py-4 bg-gray-900 text-white font-black rounded-2xl hover:scale-105 transition-transform shadow-lg"
        >
          立即登记
        </button>
      </div>

      {/* Points Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl p-10 relative shadow-2xl space-y-8 animate-scaleUp max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setShowRegisterModal(false)} className="absolute top-8 right-8 text-gray-300 hover:text-red-500 transition-colors">
              <X size={32} />
            </button>
            
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-gray-950">周边购买登记</h2>
              <p className="text-gray-400 font-bold text-sm">将您的热爱转化为支持的力量</p>
            </div>

            {showSuccess ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-6 animate-fadeIn">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-inner">
                  <CheckCircle size={48} />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black text-gray-900">登记成功！</h3>
                  <p className="text-green-600 font-bold mt-2">预计获得积分: +{formData.quantity * 10}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Tabs for switching between form and history */}
                <div className="flex bg-gray-50 p-1 rounded-2xl">
                  <button 
                    onClick={() => setViewHistory(false)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${!viewHistory ? 'bg-white text-green-700 shadow-sm' : 'text-gray-400'}`}
                  >
                    <ClipboardList size={16} /> 提交登记
                  </button>
                  <button 
                    onClick={() => setViewHistory(true)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${viewHistory ? 'bg-white text-green-700 shadow-sm' : 'text-gray-400'}`}
                  >
                    <History size={16} /> 我的记录
                  </button>
                </div>

                {!viewHistory ? (
                  <form onSubmit={handleRegisterSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">周边类型</label>
                        <select 
                          required
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          className="w-full p-4 rounded-xl bg-gray-50 border-none outline-none focus:ring-4 focus:ring-green-100 font-bold text-sm appearance-none"
                        >
                          <option value="">请选择周边</option>
                          <option value="棉花娃娃">棉花娃娃</option>
                          <option value="亚克力摆件">亚克力摆件</option>
                          <option value="纸类周边">纸类周边</option>
                          <option value="穿戴周边">穿戴周边</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">购买数量</label>
                        <input 
                          type="number" 
                          min="1"
                          required
                          value={formData.quantity}
                          onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                          className="w-full p-4 rounded-xl bg-gray-50 border-none outline-none focus:ring-4 focus:ring-green-100 font-bold text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">联系人姓名</label>
                      <input 
                        type="text" 
                        required
                        placeholder="请输入真实姓名"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full p-4 rounded-xl bg-gray-50 border-none outline-none focus:ring-4 focus:ring-green-100 font-bold text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">联系电话</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="请输入您的手机号"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full p-4 rounded-xl bg-gray-50 border-none outline-none focus:ring-4 focus:ring-green-100 font-bold text-sm"
                      />
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                      <Info size={18} className="text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-1">积分计算规则</p>
                        <p className="text-[10px] text-blue-700 font-medium">每购买 1 件周边 = 10 积分。本次登记预计可得 <span className="font-black text-blue-950 underline">{formData.quantity * 10} 积分</span>。</p>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-5 gradient-redsea text-white font-black text-xl rounded-2xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} /> 提交登记
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Mock History Records */}
                    <div className="p-5 border-2 border-dashed border-gray-100 rounded-2xl flex justify-between items-center group hover:border-green-200 transition-colors">
                      <div>
                        <h4 className="font-black text-gray-800 text-sm">购买棉花娃娃 × 2</h4>
                        <p className="text-[10px] text-gray-400 font-bold">2026-02-04 14:20</p>
                      </div>
                      <div className="text-lg font-black text-green-600">+20</div>
                    </div>
                    <div className="p-5 border-2 border-dashed border-gray-100 rounded-2xl flex justify-between items-center bg-gray-50/50 opacity-70">
                      <div>
                        <h4 className="font-black text-gray-800 text-sm">参与应援活动消耗</h4>
                        <p className="text-[10px] text-gray-400 font-bold">2026-02-03 09:15</p>
                      </div>
                      <div className="text-lg font-black text-red-400">-15</div>
                    </div>
                    <div className="p-5 border-2 border-dashed border-gray-100 rounded-2xl flex justify-between items-center group hover:border-green-200 transition-colors">
                      <div>
                        <h4 className="font-black text-gray-800 text-sm">购买亚克力摆件 × 1</h4>
                        <p className="text-[10px] text-gray-400 font-bold">2026-02-01 18:40</p>
                      </div>
                      <div className="text-lg font-black text-green-600">+10</div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between px-2">
                      <span className="text-xs font-black text-gray-400 italic">当前可用积分余额</span>
                      <span className="text-3xl font-black text-green-700">15</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

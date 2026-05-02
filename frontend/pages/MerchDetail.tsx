
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, ShieldCheck, Clock, Users, Flame, CreditCard, ChevronRight, CheckCircle } from 'lucide-react';
import { MOCK_MERCH } from '../constants';

export const MerchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isOrdered, setIsOrdered] = useState(false);
  
  const item = MOCK_MERCH.find(m => m.id === id);

  if (!item) return <div className="py-20 text-center font-black">商品未找到</div>;

  const progress = (item.currentJoined / item.targetGoal) * 100;

  const handleOrder = () => {
    setIsOrdered(true);
    setTimeout(() => setIsOrdered(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fadeIn space-y-10">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-gray-400 hover:text-green-600 font-black transition-colors"
      >
        <ArrowLeft size={20} /> 返回商城
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Gallery */}
        <div className="space-y-6">
          <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl bg-white border border-gray-100">
            <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {item.gallery.map((img, idx) => (
              <div key={idx} className="aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-green-500 cursor-pointer shadow-sm">
                <img src={img} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info & Group Buy Status */}
        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-[3rem] p-10 border border-gray-50 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <span className="gradient-ningyuzhi text-green-900 text-xs font-black px-4 py-1 rounded-full flex items-center gap-1">
                <Flame size={14} className="text-red-500 fill-current" /> 拼团中 · 满{item.targetGoal}发货
              </span>
              <span className="text-gray-300 font-bold text-xs uppercase tracking-widest">{item.category}</span>
            </div>

            <h1 className="text-4xl font-black text-gray-900 leading-tight">
              {item.title}
            </h1>

            <div className="flex items-end gap-10 py-6 border-y border-gray-50">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">拼团定金</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-green-600">¥</span>
                  <span className="text-5xl font-black text-green-600">{item.deposit}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">预估全款</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-gray-500">¥</span>
                  <span className="text-2xl font-black text-gray-500">{item.price}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar Section - WeiDian Style with Ningyuzhi Gradient */}
            <div className="bg-green-50/50 p-8 rounded-[2.5rem] border border-green-100 space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <Users className="text-green-700" size={24} />
                  <div>
                    <p className="text-sm font-black text-green-950">已参与人数: {item.currentJoined}</p>
                    <p className="text-[10px] text-green-700 font-bold">目标人数: {item.targetGoal}人</p>
                  </div>
                </div>
                <span className="text-3xl font-black text-green-700">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-5 bg-white rounded-full overflow-hidden p-1 shadow-inner">
                <div 
                  className="h-full gradient-ningyuzhi rounded-full transition-all duration-1000 shadow-lg" 
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 text-center font-black italic">
                * 若拼团不成功，定金将按原路径退回
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleOrder}
                className="flex-grow py-6 gradient-ningyuzhi text-green-900 font-black text-2xl rounded-3xl shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-3"
              >
                <CreditCard size={28} /> 支付定金
              </button>
              <button className="p-6 bg-gray-50 text-gray-400 rounded-3xl hover:bg-green-50 hover:text-green-600 transition-colors">
                <Share2 size={28} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-sm space-y-6">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-green-500" /> 应援站保障
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <CheckCircle size={14} className="text-green-500" /> 正品授权设计
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <Clock size={14} className="text-green-500" /> 满额即刻投产
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Area */}
      <div className="bg-white rounded-[3.5rem] p-12 border border-gray-50 shadow-sm space-y-12">
        <div className="flex border-b border-gray-50">
          <button className="px-10 py-6 text-xl font-black border-b-4 border-green-600 text-green-700">商品详情</button>
          <button className="px-10 py-6 text-xl font-black text-gray-300 hover:text-gray-500">成团公示</button>
        </div>
        <div className="prose prose-green max-w-none text-gray-600 font-medium leading-relaxed">
          <p className="text-lg">{item.description}</p>
          <div className="mt-10 space-y-10">
            <img src={item.gallery[0]} className="w-full rounded-[2.5rem] shadow-xl" />
            <div className="bg-gray-50 p-10 rounded-[2.5rem]">
              <h4 className="text-2xl font-black text-gray-900 mb-6">拼团须知</h4>
              <ul className="space-y-4 text-sm font-bold">
                <li>1. 本周边由粉丝自主发起，非官方出版物，仅供同好收藏。</li>
                <li>2. 达到起做量后，我们将公示成团信息并开启尾款补缴。</li>
                <li>3. 制作周期预计 15-30 个工作日，请耐心等待。</li>
                <li>4. 客服咨询请前往“交流广场”置顶帖或私信管理组。</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast Overlay */}
      {isOrdered && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-12 text-center space-y-6 shadow-2xl animate-scaleUp">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
              <CheckCircle size={56} />
            </div>
            <h3 className="text-4xl font-black text-gray-900">定金支付成功</h3>
            <p className="text-gray-500 font-bold text-lg italic">感谢你对宁渝枝周边的热爱！已自动为您加入拼团队列。</p>
            <button 
              onClick={() => setIsOrdered(false)}
              className="px-12 py-4 gradient-ningyuzhi text-green-900 font-black rounded-2xl shadow-lg"
            >
              确认
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

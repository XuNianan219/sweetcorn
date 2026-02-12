
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, ShieldCheck, Info } from 'lucide-react';

export const SupportApply: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fadeIn">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 bg-green-100 rounded-[2rem] flex items-center justify-center text-green-600 mx-auto shadow-inner">
            <ShieldCheck size={48} />
          </div>
          <h1 className="text-4xl font-black text-gray-900">申请已收到</h1>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            感谢你对宁渝枝的支持！应援管理委员会将在 3 个工作日内通过站内信或预留联系方式与你取得联系。
          </p>
          <Link to="/activity" className="inline-block px-10 py-4 gradient-ningyuzhi text-green-950 font-black rounded-2xl shadow-lg">
            返回活动中心
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Link to="/activity" className="flex items-center gap-2 text-gray-500 hover:text-green-600 font-black transition-colors">
          <ArrowLeft size={20} /> 取消申请
        </Link>
        <h1 className="text-3xl font-black text-green-950">应援申请通道</h1>
        <div className="w-20" />
      </div>

      <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-green-50">
        <div className="mb-10 flex items-start gap-4 p-6 bg-blue-50 text-blue-700 rounded-3xl border border-blue-100">
          <Info className="flex-shrink-0" />
          <p className="text-sm font-bold leading-relaxed">
            注意：所有应援申请均需遵守当地法律法规。请确保你的方案具有可行性，并准备好初步的预算与执行计划。
          </p>
        </div>

        <form onSubmit={handleApply} className="space-y-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">申请人/组织名称</label>
                <input required type="text" className="w-full p-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-green-100 font-medium" placeholder="如：XX应援站 / 张三" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">联系方式 (微信/手机)</label>
                <input required type="text" className="w-full p-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-green-100 font-medium" placeholder="方便委员会联系您" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">应援主题/名称</label>
              <input required type="text" className="w-full p-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-green-100 font-medium" placeholder="例如：2026年巡演南京站应援" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">方案简述</label>
              <textarea required className="w-full h-40 p-6 bg-gray-50 rounded-[2rem] border-none outline-none focus:ring-4 focus:ring-green-100 font-medium resize-none" placeholder="请简要描述您的应援内容，包括地点、形式、物料类型等..." />
            </div>
          </div>

          <button type="submit" className="w-full py-6 gradient-redsea text-white font-black text-xl rounded-2xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
            <Send size={24} /> 确认提交审核
          </button>
        </form>
      </div>
    </div>
  );
};

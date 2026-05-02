import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info, Send, ShieldCheck } from 'lucide-react';

export const FanSupportSubmit: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fadeIn">
        <div className="text-center space-y-5 max-w-md">
          <div className="w-20 h-20 bg-rose-100 rounded-3xl mx-auto flex items-center justify-center text-rose-600">
            <ShieldCheck size={38} />
          </div>
          <h1 className="text-4xl font-black text-gray-900">提交成功</h1>
          <p className="text-gray-500">应援项目申请已进入审核队列，3 个工作日内反馈。</p>
          <Link to="/activity/support" className="inline-block px-8 py-3 rounded-2xl gradient-ningyuzhi font-black text-green-900">
            返回应援区域
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Link to="/activity/support" className="flex items-center gap-2 text-gray-500 hover:text-rose-600 font-black">
          <ArrowLeft size={18} />
          返回应援区域
        </Link>
        <h1 className="text-3xl font-black text-rose-950">应援项目提交通道</h1>
        <div className="w-24" />
      </div>

      <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-green-50 space-y-8">
        <div className="flex items-start gap-3 p-5 bg-blue-50 rounded-2xl border border-blue-100 text-blue-700">
          <Info size={18} className="mt-0.5" />
          <p className="text-sm font-bold">请确保应援内容合法合规，不得侵犯第三方权益。</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="space-y-5"
        >
          <input required className="w-full p-4 rounded-2xl bg-gray-50 outline-none" placeholder="申请人 / 组织名" />
          <input required className="w-full p-4 rounded-2xl bg-gray-50 outline-none" placeholder="联系方式（微信/手机）" />
          <input required className="w-full p-4 rounded-2xl bg-gray-50 outline-none" placeholder="应援项目名称" />
          <textarea required className="w-full h-40 p-4 rounded-2xl bg-gray-50 outline-none resize-none" placeholder="执行方案、物料、预算、时间线..." />
          <button type="submit" className="w-full py-5 gradient-redsea text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2">
            <Send size={20} />
            提交审核
          </button>
        </form>
      </div>
    </div>
  );
};

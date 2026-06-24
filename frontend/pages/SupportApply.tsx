
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, ShieldCheck, Info } from 'lucide-react';
import { useLang } from '../contexts/LanguageContext';

export const SupportApply: React.FC = () => {
  const { t } = useLang();
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
          <h1 className="text-4xl font-black text-gray-900">{t('申请已收到', 'Application received')}</h1>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            {t('感谢你对宁渝枝的支持！应援管理委员会将在 3 个工作日内通过站内信或预留联系方式与你取得联系。', 'Thanks for your support! The support committee will contact you within 3 business days via message or your provided contact.')}
          </p>
          <Link to="/activity" className="inline-block px-10 py-4 gradient-ningyuzhi text-green-950 font-black rounded-2xl shadow-lg">
            {t('返回活动中心', 'Back to activities')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Link to="/activity" className="flex items-center gap-2 text-gray-500 hover:text-green-600 font-black transition-colors">
          <ArrowLeft size={20} /> {t('取消申请', 'Cancel')}
        </Link>
        <h1 className="text-3xl font-black text-green-950">{t('应援申请通道', 'Support Application')}</h1>
        <div className="w-20" />
      </div>

      <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-green-50">
        <div className="mb-10 flex items-start gap-4 p-6 bg-blue-50 text-blue-700 rounded-3xl border border-blue-100">
          <Info className="flex-shrink-0" />
          <p className="text-sm font-bold leading-relaxed">
            {t('注意：所有应援申请均需遵守当地法律法规。请确保你的方案具有可行性，并准备好初步的预算与执行计划。', 'Note: all applications must comply with local laws. Please ensure your plan is feasible with a preliminary budget and execution plan.')}
          </p>
        </div>

        <form onSubmit={handleApply} className="space-y-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">{t('申请人/组织名称', 'Applicant / organization')}</label>
                <input required type="text" className="w-full p-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-green-100 font-medium" placeholder={t('如：XX应援站 / 张三', 'e.g. XX fan club / Jane Doe')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">{t('联系方式 (微信/手机)', 'Contact (WeChat/phone)')}</label>
                <input required type="text" className="w-full p-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-green-100 font-medium" placeholder={t('方便委员会联系您', 'So the committee can reach you')} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">{t('应援主题/名称', 'Support theme / name')}</label>
              <input required type="text" className="w-full p-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-green-100 font-medium" placeholder={t('例如：2026年巡演南京站应援', 'e.g. 2026 Nanjing tour support')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">{t('方案简述', 'Plan summary')}</label>
              <textarea required className="w-full h-40 p-6 bg-gray-50 rounded-[2rem] border-none outline-none focus:ring-4 focus:ring-green-100 font-medium resize-none" placeholder={t('请简要描述您的应援内容，包括地点、形式、物料类型等...', 'Briefly describe your support plan — location, format, materials, etc...')} />
            </div>
          </div>

          <button type="submit" className="w-full py-6 gradient-redsea text-white font-black text-xl rounded-2xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
            <Send size={24} /> {t('确认提交审核', 'Submit for review')}
          </button>
        </form>
      </div>
    </div>
  );
};

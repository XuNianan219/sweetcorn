import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Loader2 } from 'lucide-react';
import { getMyIdeas, type Idea } from '../services/merchandiseService';
import { useLang } from '../contexts/LanguageContext';

// 「我的创意」——用户查看自己提交的周边创意及审核状态（待审核/已通过/已退回+原因）
export const MyIdeas: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [list, setList] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMyIdeas()
      .then((res) => !cancelled && setList(res))
      .catch(() => !cancelled && setList([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const badge = (status?: string) => {
    if (status === 'approved') return { text: t('已通过', 'Approved'), cls: 'bg-green-100 text-green-700' };
    if (status === 'rejected') return { text: t('已退回', 'Rejected'), cls: 'bg-red-100 text-red-600' };
    return { text: t('待审核', 'Pending'), cls: 'bg-yellow-100 text-yellow-700' };
  };

  return (
    <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
          <Lightbulb size={22} />
        </span>
        <div>
          <h2 className="text-lg font-black text-green-950">{t('我的创意', 'My Ideas')}</h2>
          <p className="text-xs text-gray-400 font-medium">{t('我提交的周边创意与审核状态', 'My submitted ideas & review status')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="py-10 text-center border-4 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/40 space-y-3">
          <p className="text-gray-400 font-bold">{t('你还没有提交过创意', 'You haven’t submitted any ideas yet')}</p>
          <button
            onClick={() => navigate('/merchandise/submit')}
            className="px-5 py-2 rounded-xl bg-green-700 text-yellow-300 text-sm font-black hover:bg-green-800 transition-colors"
          >
            {t('去提交创意', 'Submit an idea')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((idea) => {
            const b = badge(idea.status);
            const clickable = idea.status === 'approved';
            return (
              <div
                key={idea.id}
                onClick={() => clickable && navigate(`/merchandise/idea/${idea.id}`)}
                className={`flex items-center gap-3 p-3 rounded-2xl bg-green-50/40 border border-green-50 ${clickable ? 'cursor-pointer hover:border-green-200 transition-colors' : ''}`}
              >
                {idea.designImages?.[0] ? (
                  <img src={idea.designImages[0]} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl gradient-ningyuzhi flex items-center justify-center shrink-0">💡</div>
                )}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 truncate">{idea.name}</span>
                    <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${b.cls}`}>{b.text}</span>
                  </div>
                  {idea.status === 'rejected' && idea.rejectReason && (
                    <p className="text-xs text-red-500 font-medium truncate mt-0.5">
                      {t('退回原因：', 'Reason: ')}{idea.rejectReason}
                    </p>
                  )}
                  {idea.status === 'approved' && (
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      {idea.wantCount} {t('人想要', 'want it')} · {t('目标', 'goal')} {idea.targetPeople}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyIdeas;

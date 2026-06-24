import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Pencil, Plus, Trash2, MapPin, Camera } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { showSuccess } from '../utils/toast';
import { useLang } from '../contexts/LanguageContext';
import {
  getExperiences,
  getRoutes,
  deleteExperience,
  deleteRoute,
  type TravelExperience,
  type TravelRoute,
} from '../services/travelService';

export const AdminTravel: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [experiences, setExperiences] = useState<TravelExperience[]>([]);
  const [routes, setRoutes] = useState<TravelRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([getExperiences(true), getRoutes(true)])
      .then(([e, r]) => {
        setExperiences(e);
        setRoutes(r);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDeleteExp = async (item: TravelExperience) => {
    if (!window.confirm(t(`确定删除「${item.title}」吗？`, `Delete "${item.title}"?`))) return;
    setBusyId(item.id);
    try {
      await deleteExperience(item.id);
      setExperiences((prev) => prev.filter((x) => x.id !== item.id));
      showSuccess(t('已删除', 'Deleted'));
    } catch {
      /* toast handled */
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteRoute = async (item: TravelRoute) => {
    if (!window.confirm(t(`确定删除「${item.title}」吗？`, `Delete "${item.title}"?`))) return;
    setBusyId(item.id);
    try {
      await deleteRoute(item.id);
      setRoutes((prev) => prev.filter((x) => x.id !== item.id));
      showSuccess(t('已删除', 'Deleted'));
    } catch {
      /* toast handled */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8 animate-fadeIn">
      <PageHeader title={t('官方旅游内容', 'Official Travel Content')} onBack={() => navigate('/travel')} />

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 size={26} className="animate-spin" />
        </div>
      ) : (
        <>
          {/* 文化体验卡片 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-green-950 flex items-center gap-2">
                <Camera size={18} className="text-green-600" />
                {t('明星文化体验', 'Culture Experiences')}
              </h2>
              <button
                onClick={() => navigate('/admin/travel/experience/new')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-700 text-yellow-300 font-black rounded-2xl shadow-md hover:bg-green-800 transition-colors text-sm"
              >
                <Plus size={16} />
                {t('新建体验', 'New')}
              </button>
            </div>
            {experiences.length === 0 ? (
              <div className="py-10 text-center border-4 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/40 text-gray-400 font-bold">
                {t('还没有官方体验', 'No experiences yet')}
              </div>
            ) : (
              <div className="space-y-3">
                {experiences.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-green-50 shadow-sm">
                    {item.coverImage ? (
                      <img src={item.coverImage} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl gradient-ningyuzhi flex items-center justify-center shrink-0">🧭</div>
                    )}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.celebrity && <span className="text-xs font-bold text-green-600">{item.celebrity}</span>}
                        {!item.isPublished && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{t('未发布', 'Draft')}</span>
                        )}
                        <span className="text-[10px] text-gray-400 font-medium">{t('排序', 'Order')} {item.orderNum}</span>
                      </div>
                      <h3 className="font-black text-gray-800 truncate">{item.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => navigate(`/admin/travel/experience/${item.id}/edit`)} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors">
                        <Pencil size={13} /> {t('编辑', 'Edit')}
                      </button>
                      <button onClick={() => handleDeleteExp(item)} disabled={busyId === item.id} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
                        {busyId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} {t('删除', 'Delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 精选线路 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-green-950 flex items-center gap-2">
                <MapPin size={18} className="text-green-600" />
                {t('精选线路', 'Featured Routes')}
              </h2>
              <button
                onClick={() => navigate('/admin/travel/route/new')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-700 text-yellow-300 font-black rounded-2xl shadow-md hover:bg-green-800 transition-colors text-sm"
              >
                <Plus size={16} />
                {t('新建线路', 'New')}
              </button>
            </div>
            {routes.length === 0 ? (
              <div className="py-10 text-center border-4 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/40 text-gray-400 font-bold">
                {t('还没有官方线路', 'No routes yet')}
              </div>
            ) : (
              <div className="space-y-3">
                {routes.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-green-50 shadow-sm">
                    {item.coverImage ? (
                      <img src={item.coverImage} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl gradient-ningyuzhi flex items-center justify-center shrink-0">🗺️</div>
                    )}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!item.isPublished && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{t('未发布', 'Draft')}</span>
                        )}
                        <span className="text-[10px] text-gray-400 font-medium">{t('排序', 'Order')} {item.orderNum}</span>
                      </div>
                      <h3 className="font-black text-gray-800 truncate">{item.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => navigate(`/admin/travel/route/${item.id}/edit`)} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors">
                        <Pencil size={13} /> {t('编辑', 'Edit')}
                      </button>
                      <button onClick={() => handleDeleteRoute(item)} disabled={busyId === item.id} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
                        {busyId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} {t('删除', 'Delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

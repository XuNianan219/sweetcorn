import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { WeeklyRouteBanner } from '../components/travel/WeeklyRouteBanner';
import { CelebrityExperiences } from '../components/travel/CelebrityExperiences';
import { TravelPostFeed } from '../components/travel/TravelPostFeed';
import { AITravelPlanner } from '../components/travel/AITravelPlanner';
import { PullToRefreshWrapper } from '../components/PullToRefreshWrapper';
import { useCurrentUser } from '../contexts/UserContext';
import { useLang } from '../contexts/LanguageContext';

export const Travel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { t } = useLang();
  const isSuperAdmin = user?.role === 'super_admin';
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = async () => {
    setRefreshKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 600));
  };

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <div className="max-w-7xl mx-auto space-y-12 pb-16 animate-fadeIn">
        {isSuperAdmin && (
          <button
            onClick={() => navigate('/admin/travel')}
            className="w-full gradient-ningyuzhi rounded-2xl p-4 text-green-950 shadow-sm flex items-center justify-between hover:scale-[1.005] transition-transform"
          >
            <span className="flex items-center gap-2 font-black">
              <Settings size={18} />
              {t('管理官方旅游内容', 'Manage official travel content')}
            </span>
            <span className="text-sm font-medium opacity-70">{t('仅超级管理员', 'Super admin only')} →</span>
          </button>
        )}
        <WeeklyRouteBanner />
        <CelebrityExperiences />
        <TravelPostFeed key={refreshKey} />
        <AITravelPlanner />
      </div>
    </PullToRefreshWrapper>
  );
};

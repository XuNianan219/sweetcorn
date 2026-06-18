import React, { useState } from 'react';
import { WeeklyRouteBanner } from '../components/travel/WeeklyRouteBanner';
import { CelebrityExperiences } from '../components/travel/CelebrityExperiences';
import { TravelPostFeed } from '../components/travel/TravelPostFeed';
import { AITravelPlanner } from '../components/travel/AITravelPlanner';
import { PullToRefreshWrapper } from '../components/PullToRefreshWrapper';

export const Travel: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = async () => {
    setRefreshKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 600));
  };

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <div className="max-w-7xl mx-auto space-y-12 pb-16 animate-fadeIn">
        <WeeklyRouteBanner />
        <CelebrityExperiences />
        <TravelPostFeed key={refreshKey} />
        <AITravelPlanner />
      </div>
    </PullToRefreshWrapper>
  );
};

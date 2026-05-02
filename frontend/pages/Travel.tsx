import React from 'react';
import { WeeklyRouteBanner } from '../components/travel/WeeklyRouteBanner';
import { CelebrityExperiences } from '../components/travel/CelebrityExperiences';
import { TravelPostFeed } from '../components/travel/TravelPostFeed';
import { AITravelPlanner } from '../components/travel/AITravelPlanner';

export const Travel: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-16 animate-fadeIn">
      <WeeklyRouteBanner />
      <CelebrityExperiences />
      <TravelPostFeed />
      <AITravelPlanner />
    </div>
  );
};

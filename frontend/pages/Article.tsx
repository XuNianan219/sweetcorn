import React, { useState } from 'react';
import { CategorySection } from '../components/CategorySection';
import { PullToRefreshWrapper } from '../components/PullToRefreshWrapper';

export const Article: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = async () => {
    setRefreshKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 600));
  };

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <div className="max-w-7xl mx-auto">
        <CategorySection key={refreshKey} category="article" />
      </div>
    </PullToRefreshWrapper>
  );
};

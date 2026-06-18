import React, { useState } from 'react';
import { CategorySection } from '../components/CategorySection';
import { ImmersiveVideoFeed } from '../components/ImmersiveVideo/ImmersiveVideoFeed';
import { ViewModeSwitch, type MediaViewMode } from '../components/ViewModeSwitch';
import { PullToRefreshWrapper } from '../components/PullToRefreshWrapper';

export const Media: React.FC = () => {
  const [viewMode, setViewMode] = useState<MediaViewMode>('waterfall');
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = async () => {
    setRefreshKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 600));
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 仅瀑布流模式支持下拉刷新；沉浸式是全屏覆盖、用自己的上下滑动 */}
      <PullToRefreshWrapper onRefresh={handleRefresh}>
        <CategorySection key={refreshKey} category="media" />
      </PullToRefreshWrapper>

      {/* 沉浸式视频流：全屏覆盖 */}
      {viewMode === 'immersive' && (
        <ImmersiveVideoFeed onExit={() => setViewMode('waterfall')} />
      )}

      {/* 左下角浮动视图切换：两种模式下都可见可点 */}
      <ViewModeSwitch mode={viewMode} onChange={setViewMode} />
    </div>
  );
};

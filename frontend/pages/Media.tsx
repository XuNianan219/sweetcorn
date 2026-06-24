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

      {/* 沉浸式视频流：全屏覆盖（内部左上角有 ← 返回按钮退出） */}
      {viewMode === 'immersive' && (
        <ImmersiveVideoFeed onExit={() => setViewMode('waterfall')} />
      )}

      {/* 视图切换按钮：仅瀑布流下显示，避免沉浸式时挡住视频底部文字 */}
      {viewMode === 'waterfall' && <ViewModeSwitch mode={viewMode} onChange={setViewMode} />}
    </div>
  );
};

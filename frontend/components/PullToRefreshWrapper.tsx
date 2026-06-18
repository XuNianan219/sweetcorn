import React from 'react';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { Loader2 } from 'lucide-react';

interface PullToRefreshWrapperProps {
  onRefresh: () => Promise<unknown>;
  children: React.ReactNode;
}

// 下拉刷新：移动端启用，桌面端（>=768）直接渲染 children 防误触
export const PullToRefreshWrapper: React.FC<PullToRefreshWrapperProps> = ({ onRefresh, children }) => {
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  if (isDesktop) {
    return <>{children}</>;
  }

  return (
    <PullToRefresh
      onRefresh={async () => {
        await onRefresh();
      }}
      pullingContent={
        <div className="flex justify-center py-3 text-green-700/70">
          <Loader2 size={20} />
        </div>
      }
      refreshingContent={
        <div className="flex justify-center py-3 text-green-700">
          <Loader2 size={20} className="animate-spin" />
        </div>
      }
    >
      <>{children}</>
    </PullToRefresh>
  );
};

export default PullToRefreshWrapper;

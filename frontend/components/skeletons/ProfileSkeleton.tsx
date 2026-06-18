import React from 'react';

// 个人主页骨架
export const ProfileSkeleton: React.FC = () => (
  <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-16 animate-pulse">
    {/* 用户卡片 */}
    <div className="bg-gray-100 rounded-[2.5rem] p-8">
      <div className="flex items-center gap-5">
        <div className="w-24 h-24 rounded-3xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-40" />
          <div className="h-4 bg-gray-200 rounded w-28" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>

    {/* 信息卡 ×2 */}
    {[0, 1].map((i) => (
      <div key={i} className="bg-white rounded-[2rem] border border-gray-50 shadow-sm p-6 space-y-4">
        <div className="h-5 bg-gray-100 rounded w-32" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
      </div>
    ))}
  </div>
);

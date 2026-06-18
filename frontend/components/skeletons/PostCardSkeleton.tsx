import React from 'react';

// 单个帖子卡片骨架（小红书瀑布流形状）
export const PostCardSkeleton: React.FC<{ tall?: boolean }> = ({ tall }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 break-inside-avoid mb-3 md:mb-4 animate-pulse">
    <div className={`w-full bg-gray-100 ${tall ? 'h-56' : 'h-40'}`} />
    <div className="p-3 space-y-2">
      <div className="h-3.5 bg-gray-100 rounded w-3/4" />
      <div className="h-3.5 bg-gray-100 rounded w-1/2" />
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100" />
          <div className="h-3 bg-gray-100 rounded w-16" />
        </div>
        <div className="h-3 bg-gray-100 rounded w-8" />
      </div>
    </div>
  </div>
);

// 一组瀑布流骨架（默认 8 个，高度交错更自然）
export const PostFeedSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <PostCardSkeleton key={i} tall={i % 3 === 0} />
    ))}
  </div>
);

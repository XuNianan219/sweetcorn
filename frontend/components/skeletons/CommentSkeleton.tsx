import React from 'react';

// 单条评论骨架
export const CommentSkeleton: React.FC = () => (
  <div className="flex gap-3 animate-pulse">
    <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-gray-100 rounded w-24" />
      <div className="h-3.5 bg-gray-100 rounded w-full" />
      <div className="h-3.5 bg-gray-100 rounded w-2/3" />
    </div>
  </div>
);

// 一组评论骨架
export const CommentListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="space-y-5">
    {Array.from({ length: count }).map((_, i) => (
      <CommentSkeleton key={i} />
    ))}
  </div>
);

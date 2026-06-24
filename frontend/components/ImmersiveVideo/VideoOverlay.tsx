import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { FeedPost } from '../../services/feedService';
import { useLang } from '../../contexts/LanguageContext';

interface VideoOverlayProps {
  post: FeedPost;
}

const textShadow = { textShadow: '0 1px 4px rgba(0,0,0,0.6)' } as const;

// 仅负责底部渐变 + 作者文案；右侧操作栏由 VideoActionBar 负责
export const VideoOverlay: React.FC<VideoOverlayProps> = ({ post }) => {
  const navigate = useNavigate();
  const { t } = useLang();
  const nickname = post.author?.nickname || t('匿名玉米', 'Anonymous corn');
  const authorId = post.author?.id;

  return (
    <>
      {/* 底部渐变遮罩 */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      {/* 底部作者信息 */}
      <div className="absolute left-4 right-20 bottom-8 sm:bottom-10 z-10 text-white space-y-1.5 pointer-events-none">
        <button
          type="button"
          onClick={() => authorId && navigate(`/users/${authorId}`)}
          className="font-black text-base pointer-events-auto active:opacity-70"
          style={textShadow}
        >
          @{nickname}
        </button>
        {post.title && (
          <p className="font-bold text-sm" style={textShadow}>
            {post.title}
          </p>
        )}
        {post.hashtags && post.hashtags.length > 0 && (
          <p className="text-sm font-medium" style={textShadow}>
            {post.hashtags.map((t) => `#${t}`).join('  ')}
          </p>
        )}
      </div>
    </>
  );
};

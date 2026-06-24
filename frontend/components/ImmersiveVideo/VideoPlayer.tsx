import React, { useEffect, useRef, useState } from 'react';
import { Heart, Pause, Volume2, VolumeX } from 'lucide-react';
import type { FeedPost } from '../../services/feedService';
import { useLang } from '../../contexts/LanguageContext';

interface VideoPlayerProps {
  post: FeedPost;
  isActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onLike: () => void; // 双击点赞（仅在未点赞时置为已赞）
  preload: 'auto' | 'metadata' | 'none';
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  post,
  isActive,
  muted,
  onToggleMute,
  onLike,
  preload,
}) => {
  const { t } = useLang();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  // 视频宽高比：>1 横屏，<=1 竖屏；默认竖屏（撑满）
  const [aspect, setAspect] = useState<number>(0);

  const lastTap = useRef(0);
  const singleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const src = post.mediaUrls[0] || post.mediaUrl || '';

  // 加载元数据后拿真实宽高比
  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (v && v.videoWidth && v.videoHeight) {
      setAspect(v.videoWidth / v.videoHeight);
    }
  };

  // 横屏：宽满、高自适应（上下黑边）；竖屏/未知：高满、宽自适应（两侧黑边）
  const videoStyle: React.CSSProperties =
    aspect > 1
      ? { width: '100%', height: 'auto', maxHeight: '100%', maxWidth: '100%' }
      : { height: '100%', width: 'auto', maxWidth: '100%', maxHeight: '100%' };

  // 根据 isActive 自动播放/暂停
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.currentTime = 0;
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      setPaused(false);
    } else {
      v.pause();
    }
  }, [isActive]);

  // 同步静音状态
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // 空格键：仅当前激活的视频响应播放/暂停切换
  useEffect(() => {
    if (!isActive) return;
    const handler = () => togglePlay();
    document.addEventListener('immersive-toggle-play', handler);
    return () => document.removeEventListener('immersive-toggle-play', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  const triggerLike = () => {
    setShowHeart(true);
    window.setTimeout(() => setShowHeart(false), 800);
    onLike();
  };

  // 区分单击（播放/暂停）与双击（点赞）
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (singleTimer.current) clearTimeout(singleTimer.current);
      lastTap.current = 0;
      triggerLike();
    } else {
      lastTap.current = now;
      singleTimer.current = setTimeout(() => {
        togglePlay();
      }, 280);
    }
  };

  return (
    <div
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden"
      onClick={handleTap}
    >
      <video
        ref={videoRef}
        src={src}
        className="object-contain block"
        style={videoStyle}
        loop
        muted={muted}
        playsInline
        preload={preload}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* 暂停图标 */}
      {paused && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center">
            <Pause size={40} className="text-white/90" fill="currentColor" />
          </div>
        </div>
      )}

      {/* 双击点赞爱心动画 */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart size={120} className="text-red-500 animate-likePop drop-shadow-lg" fill="currentColor" />
        </div>
      )}

      {/* 右下角声音开关 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleMute();
        }}
        className="absolute bottom-6 right-4 w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors z-20"
        title={muted ? t('取消静音', 'Unmute') : t('静音', 'Mute')}
      >
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string; // 作用在 <img> 上，保持原有尺寸/object-fit
  aspectRatio?: string; // 可选，如 "1 / 1"，给占位一个确定高度
}

// 图片渐入：加载前淡黄骨架占位，加载完成淡入，失败显示占位
export const LazyImage: React.FC<LazyImageProps> = ({ src, alt = '', className = '', aspectRatio }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <span
      className="relative block w-full h-full overflow-hidden bg-yellow-50/60"
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {!loaded && !error && (
        <span className="absolute inset-0 animate-pulse bg-gradient-to-br from-yellow-100/70 to-green-100/40" />
      )}

      {error ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-300 text-xs font-medium">
          <ImageOff size={20} />
          图片加载失败
        </span>
      ) : (
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={className}
        />
      )}
    </span>
  );
};

export default LazyImage;

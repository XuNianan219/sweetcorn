import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { FeedPost } from '../../services/feedService';
import { CommentSection } from '../comments/CommentSection';
import { useLang } from '../../contexts/LanguageContext';

interface CommentDrawerProps {
  post: FeedPost;
  open: boolean;
  onClose: () => void;
}

export const CommentDrawer: React.FC<CommentDrawerProps> = ({ post, open, onClose }) => {
  const { t } = useLang();
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);

  // 进出动画 + 挂载控制
  useEffect(() => {
    if (open) {
      setRender(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = setTimeout(() => setRender(false), 300);
    return () => clearTimeout(t);
  }, [open]);

  // 打开时锁定 body 滚动
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!render) return null;

  // 阻止抽屉内部的滚轮/触摸/点击冒泡到沉浸式容器（避免切换视频/误触）
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return createPortal(
    <div className="fixed inset-0 z-[200]" onWheel={stop} onTouchStart={stop} onTouchMove={stop} onTouchEnd={stop}>
      {/* backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* 面板：移动端从底部滑入，桌面端从右侧滑入 */}
      <div
        onClick={stop}
        className={`absolute bg-white shadow-2xl flex flex-col select-text transition-transform duration-300 ease-out
          bottom-0 left-0 right-0 h-[70vh] rounded-t-3xl
          sm:top-0 sm:right-0 sm:left-auto sm:h-full sm:w-[400px] sm:rounded-t-none sm:rounded-l-3xl
          ${visible ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'}`}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-black text-green-950">{t('评论', 'Comments')}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* 评论区（复用） */}
        <div className="flex-grow overflow-y-auto px-4 py-4 custom-scrollbar">
          <CommentSection postId={post.id} />
        </div>
      </div>
    </div>,
    document.body,
  );
};

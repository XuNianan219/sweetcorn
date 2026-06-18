import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { PostComposer } from './PostComposer';

interface PostComposerModalProps {
  open: boolean;
  onClose: () => void;
  category: string;
  onPosted?: () => void;
}

export const PostComposerModal: React.FC<PostComposerModalProps> = ({
  open,
  onClose,
  category,
  onPosted,
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handlePosted = () => {
    onClose();
    onPosted?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 transition-opacity animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl">
        {/* 关闭按钮浮在表单右上角 */}
        <button
          onClick={onClose}
          aria-label="关闭"
          className="absolute top-5 right-4 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
        >
          <X size={14} />
        </button>

        <PostComposer category={category} onPosted={handlePosted} />
      </div>
    </div>
  );
};

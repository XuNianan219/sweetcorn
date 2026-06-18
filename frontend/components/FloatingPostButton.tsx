import React from 'react';
import { Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const POST_PATHS = ['/discussion', '/media', '/article', '/travel'];

interface FloatingPostButtonProps {
  onClick: () => void;
}

export const FloatingPostButton: React.FC<FloatingPostButtonProps> = ({ onClick }) => {
  const location = useLocation();

  if (!POST_PATHS.includes(location.pathname)) return null;

  return (
    <button
      onClick={onClick}
      aria-label="发布新帖"
      style={{
        bottom: 'calc(2rem + env(safe-area-inset-bottom))',
        right: 'calc(6rem + env(safe-area-inset-right))',
      }}
      className="fixed w-14 h-14 gradient-ningyuzhi rounded-full shadow-lg flex items-center justify-center text-green-900 z-50 hover:scale-110 active:scale-95 transition-transform"
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
};

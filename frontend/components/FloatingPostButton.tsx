import React from 'react';
import { Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';

const POST_PATHS = ['/discussion', '/media', '/article', '/travel'];

interface FloatingPostButtonProps {
  onClick: () => void;
}

export const FloatingPostButton: React.FC<FloatingPostButtonProps> = ({ onClick }) => {
  const location = useLocation();
  const { t } = useLang();

  if (!POST_PATHS.includes(location.pathname)) return null;

  return (
    <button
      onClick={onClick}
      aria-label={t('发布新帖', 'New post')}
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-14 h-14 gradient-ningyuzhi rounded-full shadow-lg flex items-center justify-center text-green-900 z-50 hover:scale-110 active:scale-95 transition-transform"
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
};

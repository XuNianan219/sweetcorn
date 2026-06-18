import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}

// 通用二级页面头：左上角返回按钮（桌面端也显示，视觉低调）
const PageHeader: React.FC<PageHeaderProps> = ({ title, showBack = true, onBack, rightSlot }) => {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }
    // 有历史就后退一步，否则回首页（避免直开链接点返回卡住）
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [onBack, navigate]);

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-2 h-12 md:h-14 mb-2">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="返回上一页"
            className="shrink-0 p-1.5 -ml-1.5 rounded-full"
          >
            <span className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-yellow-50 hover:bg-yellow-100 text-green-800 flex items-center justify-center transition-all hover:shadow-sm cursor-pointer">
              <ArrowLeft size={18} />
            </span>
          </button>
        )}
        {title ? (
          <h1 className="flex-grow min-w-0 truncate text-lg font-black text-green-950">{title}</h1>
        ) : (
          <div className="flex-grow" />
        )}
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </div>
  );
};

export default PageHeader;

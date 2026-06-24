import React from 'react';
import { Smartphone, Waves } from 'lucide-react';
import { useLang } from '../contexts/LanguageContext';

export type MediaViewMode = 'waterfall' | 'immersive';

interface ViewModeSwitchProps {
  mode: MediaViewMode;
  onChange: (mode: MediaViewMode) => void;
}

export const ViewModeSwitch: React.FC<ViewModeSwitchProps> = ({ mode, onChange }) => {
  const { t } = useLang();
  const immersive = mode === 'immersive';
  // 沉浸式时抬高层级盖过全屏视频(z-100)，瀑布流时低于弹窗(z-50)
  const zClass = immersive ? 'z-[110]' : 'z-40';

  // 沉浸式：移到左上角（避开底部标题/话题），黑色半透明 + 白色图标；
  // 瀑布流：保持左下角，白色胶囊 + 绿色图标
  const positionClass = immersive
    ? 'fixed top-20 left-4'
    : 'fixed left-6 bottom-20 md:bottom-6';
  const positionStyle: React.CSSProperties = immersive
    ? { top: 'calc(5rem + env(safe-area-inset-top))', left: 'calc(1rem + env(safe-area-inset-left))' }
    : { paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)' };

  const pillClass = immersive
    ? 'bg-black/40 backdrop-blur-md border border-white/20'
    : 'bg-white/80 backdrop-blur-md shadow-lg border border-green-50';

  const btn = (active: boolean) => {
    const base = 'flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300';
    if (active) return `${base} bg-yellow-400 text-green-900 shadow-sm`;
    return immersive
      ? `${base} text-white/80 hover:text-white`
      : `${base} text-gray-400 hover:text-green-600`;
  };

  return (
    <div style={positionStyle} className={`${positionClass} ${zClass}`}>
      <div className={`flex items-center gap-1 p-1 rounded-full hover:scale-105 transition-transform duration-300 ${pillClass}`}>
        <button
          type="button"
          onClick={() => onChange('waterfall')}
          className={btn(mode === 'waterfall')}
          title={t('瀑布流', 'Grid')}
          aria-label={t('瀑布流视图', 'Grid view')}
        >
          <Waves size={18} />
        </button>
        <button
          type="button"
          onClick={() => onChange('immersive')}
          className={btn(mode === 'immersive')}
          title={t('沉浸式', 'Immersive')}
          aria-label={t('沉浸式视图', 'Immersive view')}
        >
          <Smartphone size={18} />
        </button>
      </div>
    </div>
  );
};

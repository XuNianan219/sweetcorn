import React from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger';

interface LoadingButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  loading?: boolean;
  variant?: Variant;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  // 深绿主按钮（黄绿基调）
  primary: 'gradient-ningyuzhi text-green-950 hover:scale-[1.02]',
  secondary: 'bg-green-50 text-green-700 hover:bg-green-100',
  danger: 'bg-red-50 text-red-600 border border-red-300 hover:bg-red-100',
};

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  variant = 'primary',
  onClick,
  children,
  disabled,
  className = '',
  type = 'button',
  ...rest
}) => {
  const isDisabled = loading || disabled;
  return (
    <button
      type={type}
      onClick={(e) => {
        if (isDisabled) return; // 彻底防 double-click
        onClick?.(e);
      }}
      disabled={isDisabled}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${VARIANT_CLASS[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
};

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Link2, X } from 'lucide-react';
import type { FeedPost } from '../../services/feedService';
import { uninterestPost, reportPost } from '../../services/postsApi';
import { useLang } from '../../contexts/LanguageContext';

interface ShareMenuProps {
  post: FeedPost;
  open: boolean;
  onClose: () => void;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ post, open, onClose }) => {
  const { t } = useLang();
  const REPORT_REASONS: { value: string; label: string }[] = [
    { value: '色情低俗', label: t('色情低俗', 'Porn / vulgar') },
    { value: '违法违规', label: t('违法违规', 'Illegal') },
    { value: '政治敏感', label: t('政治敏感', 'Politically sensitive') },
    { value: '其他', label: t('其他', 'Other') },
  ];
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);
  const [reporting, setReporting] = useState(false); // 是否处于举报二级菜单
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (open) {
      setRender(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = setTimeout(() => {
      setRender(false);
      setReporting(false);
    }, 250);
    return () => clearTimeout(t);
  }, [open]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1600);
  };

  const close = () => {
    setReporting(false);
    onClose();
  };

  const handleCopy = async () => {
    const url = `${window.location.origin}/#/posts/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(t('链接已复制', 'Link copied'));
    } catch {
      showToast(url);
    }
  };

  const handleUninterest = async () => {
    try {
      await uninterestPost(post.id);
    } catch {
      /* 占位，失败也提示 */
    }
    showToast(t('已记录，将减少类似推荐', 'Noted — we’ll show fewer like this'));
    setTimeout(close, 400);
  };

  const handleReport = async (reason: string) => {
    try {
      await reportPost(post.id, reason);
    } catch {
      /* ignore */
    }
    showToast(t('已收到举报，我们会尽快处理', 'Report received — we’ll review it soon'));
    setTimeout(close, 400);
  };

  if (!render) return null;

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const Item: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }> = ({
    icon,
    label,
    onClick,
    danger,
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-3.5 text-left font-bold text-sm active:bg-green-50 hover:bg-yellow-50 transition-colors ${
        danger ? 'text-red-500' : 'text-gray-700'
      }`}
    >
      <span className="text-lg w-6 text-center">{icon}</span>
      {label}
    </button>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      onWheel={stop}
      onTouchStart={stop}
      onTouchMove={stop}
      onTouchEnd={stop}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
      />

      <div
        onClick={stop}
        className={`relative w-full sm:max-w-sm bg-white shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden transition-transform duration-250 ease-out
          ${visible ? 'translate-y-0' : 'translate-y-full sm:translate-y-4'} ${visible ? 'sm:opacity-100' : 'sm:opacity-0'}`}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          {reporting ? (
            <button onClick={() => setReporting(false)} className="flex items-center gap-1 text-sm font-bold text-gray-500">
              <ChevronLeft size={18} /> {t('返回', 'Back')}
            </button>
          ) : (
            <h3 className="text-base font-black text-green-950">{t('分享', 'Share')}</h3>
          )}
          <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
            <X size={16} />
          </button>
        </div>

        {!reporting ? (
          <div className="py-1 max-h-[60vh] overflow-y-auto">
            <Item icon={<Link2 size={18} className="inline" />} label={t('复制链接', 'Copy link')} onClick={handleCopy} />
            <Item icon="💬" label={t('分享到微信', 'Share to WeChat')} onClick={() => showToast(t('微信分享暂未开放', 'WeChat sharing not available yet'))} />
            <Item icon="🔄" label={t('分享到微博', 'Share to Weibo')} onClick={() => showToast(t('微博分享暂未开放', 'Weibo sharing not available yet'))} />
            <div className="h-px bg-gray-100 my-1" />
            <Item icon="🙈" label={t('不感兴趣', 'Not interested')} onClick={handleUninterest} />
            <Item icon="🚩" label={t('举报', 'Report')} onClick={() => setReporting(true)} danger />
          </div>
        ) : (
          <div className="py-1">
            <p className="px-5 py-2 text-xs font-bold text-gray-400">{t('请选择举报原因', 'Select a reason')}</p>
            {REPORT_REASONS.map((r) => (
              <Item key={r.value} icon="🚩" label={r.label} onClick={() => handleReport(r.value)} danger />
            ))}
          </div>
        )}
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] bg-black/80 text-white px-5 py-2.5 rounded-full text-sm font-bold pointer-events-none">
          {toast}
        </div>
      )}
    </div>,
    document.body,
  );
};

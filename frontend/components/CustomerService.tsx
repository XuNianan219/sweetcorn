import React, { useState } from 'react';
import { Headphones, X, ChevronDown, UserRound } from 'lucide-react';
import { useLang } from '../contexts/LanguageContext';
import { useCurrentUser } from '../contexts/UserContext';

// ─── 配置区（这里的内容你后面自己填）──────────────────────────
// 常见问题：增删条目改这个数组即可。答案先放占位，替换成真实内容。
const FAQS: { q: string; a: string }[] = [
  { q: '示例问题 1：怎么下单购买周边？', a: '这里填答案 1（占位，替换成真实回答）' },
  { q: '示例问题 2：拼团怎么发起？', a: '这里填答案 2（占位，替换成真实回答）' },
  { q: '示例问题 3：多久发货 / 怎么查物流？', a: '这里填答案 3（占位，替换成真实回答）' },
  { q: '示例问题 4：怎么申请退款？', a: '这里填答案 4（占位，替换成真实回答）' },
];

// 转人工客服：替换成你的真实微信 / 工单 / 客服链接
const HUMAN_SUPPORT_URL = 'https://example.com/your-support-link';

// ─── 莫兰迪配色 ──────────────────────────────────────────────
const ACCENT = '#b08d8d';
const ACCENT_BG = '#efe7e3';
const TEXT = '#5c544a';
const BORDER = '#ece5df';

export const CustomerService: React.FC = () => {
  const { t } = useLang();
  const { isLoggedIn } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // 只在登录后显示；未登录（含登录页 / 注册页）不渲染
  if (!isLoggedIn) return null;

  return (
    <>
      {/* 展开的面板 */}
      {open && (
        <div
          className="fixed bottom-52 md:bottom-40 right-4 md:right-6 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white shadow-xl border overflow-hidden animate-fadeIn"
          style={{ borderColor: BORDER }}
        >
          {/* 头部 */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: ACCENT_BG }}
          >
            <span className="flex items-center gap-2 font-bold text-sm" style={{ color: TEXT }}>
              <Headphones size={16} style={{ color: ACCENT }} />
              {t('客服中心', 'Support')}
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label={t('收起', 'Close')}
              className="p-1 rounded-full hover:bg-black/5 transition-colors"
              style={{ color: TEXT }}
            >
              <X size={16} />
            </button>
          </div>

          {/* 常见问题 */}
          <div className="max-h-72 overflow-y-auto p-3 space-y-2">
            <p className="px-1 text-xs font-bold" style={{ color: '#9a8f82' }}>
              {t('常见问题', 'FAQ')}
            </p>
            {FAQS.map((item, idx) => {
              const expanded = activeIdx === idx;
              return (
                <div key={idx} className="rounded-xl overflow-hidden" style={{ background: '#faf7f5' }}>
                  <button
                    onClick={() => setActiveIdx(expanded ? null : idx)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-black/[0.02] transition-colors"
                    style={{ color: TEXT }}
                  >
                    <span className="line-clamp-2">{item.q}</span>
                    <ChevronDown
                      size={15}
                      className="shrink-0 transition-transform"
                      style={{ color: ACCENT, transform: expanded ? 'rotate(180deg)' : 'none' }}
                    />
                  </button>
                  {expanded && (
                    <p className="px-3 pb-3 text-xs leading-relaxed" style={{ color: '#7a7266' }}>
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* 转人工客服 */}
          <div className="p-3 border-t" style={{ borderColor: BORDER }}>
            <a
              href={HUMAN_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: ACCENT }}
            >
              <UserRound size={16} />
              {t('转人工客服', 'Talk to a human')}
            </a>
          </div>
        </div>
      )}

      {/* 悬浮圆形按钮 */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('客服', 'Support')}
        className="fixed bottom-36 md:bottom-24 right-4 md:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform"
        style={{ background: ACCENT }}
      >
        {open ? <X size={26} strokeWidth={2.5} /> : <Headphones size={26} strokeWidth={2.5} />}
      </button>
    </>
  );
};

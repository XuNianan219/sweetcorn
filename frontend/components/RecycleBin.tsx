import React, { useEffect, useMemo, useState } from 'react';
import { FileText, FolderOpen, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import {
  getRecycledPosts,
  permanentDeletePost,
  restorePost,
  type DeletedPost,
  type RecycledPosts,
} from '../services/recycleService';
import { getCategoryName } from '../constants/categories';

type GroupKey = 'discussion' | 'media' | 'article' | 'travel';

const TABS: { key: GroupKey; emoji: string }[] = [
  { key: 'discussion', emoji: '💬' },
  { key: 'media', emoji: '📷' },
  { key: 'article', emoji: '📝' },
  { key: 'travel', emoji: '🧳' },
];

const EMPTY: RecycledPosts = {
  discussion: [],
  media: [],
  article: [],
  travel: [],
  counts: { discussion: 0, media: 0, article: 0, travel: 0 },
};

// 删除时间 → 「X 天前删除」
function deletedAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '';
  const days = Math.floor(diff / (24 * 3600 * 1000));
  if (days >= 1) return `${days} 天前删除`;
  const hours = Math.floor(diff / (3600 * 1000));
  if (hours >= 1) return `${hours} 小时前删除`;
  const mins = Math.floor(diff / (60 * 1000));
  return `${Math.max(1, mins)} 分钟前删除`;
}

export const RecycleBin: React.FC = () => {
  const [data, setData] = useState<RecycledPosts>(EMPTY);
  const [activeTab, setActiveTab] = useState<GroupKey>('discussion');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    getRecycledPosts()
      .then((res) => {
        setData(res);
        // 默认选中第一个有数据的分区
        const firstWithData = TABS.find((t) => res.counts[t.key] > 0);
        if (firstWithData) setActiveTab(firstWithData.key);
      })
      .catch((e) => setError(e?.message || '加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const removeLocal = (key: GroupKey, id: string) => {
    setData((prev) => ({
      ...prev,
      [key]: prev[key].filter((p) => p.id !== id),
      counts: { ...prev.counts, [key]: Math.max(0, prev.counts[key] - 1) },
    }));
  };

  const handleRestore = async (item: DeletedPost) => {
    setBusyId(item.id);
    setError('');
    try {
      await restorePost(item.id);
      removeLocal(item.category as GroupKey, item.id);
    } catch (e: any) {
      setError(e?.message || '恢复失败');
    } finally {
      setBusyId(null);
    }
  };

  const handlePermanentDelete = async (item: DeletedPost) => {
    if (!window.confirm('永久删除后不可恢复，确认删除吗？')) return;
    setBusyId(item.id);
    setError('');
    try {
      await permanentDeletePost(item.id);
      removeLocal(item.category as GroupKey, item.id);
    } catch (e: any) {
      setError(e?.message || '删除失败');
    } finally {
      setBusyId(null);
    }
  };

  const list = useMemo(() => data[activeTab], [data, activeTab]);

  return (
    <div className="space-y-5">
      {/* 分区 tab */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          const count = data.counts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-black transition-colors border-2 ${
                active
                  ? 'bg-yellow-400 text-green-900 border-green-600'
                  : 'bg-white text-gray-500 border-transparent hover:text-green-600'
              }`}
            >
              <span>{tab.emoji}</span>
              {getCategoryName(tab.key)}
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none ${
                    active ? 'bg-green-700 text-white' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-medium">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 size={26} className="animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="py-16 text-center border-4 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/40">
          <FolderOpen size={44} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-black">这里还没有内容</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-4 p-4 rounded-[1.5rem] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              {/* 封面 / 占位 */}
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                {item.coverImage ? (
                  <img src={item.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FileText size={20} className="text-gray-300" />
                )}
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-green-50 text-green-700">
                    {getCategoryName(item.category)}
                  </span>
                  <span className="text-[11px] text-gray-400 font-bold">{deletedAgo(item.deletedAt)}</span>
                </div>
                <h3 className="font-black text-gray-800 line-clamp-1">
                  {item.title || item.content?.slice(0, 50) || '无标题内容'}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRestore(item)}
                  disabled={busyId === item.id}
                  className="flex items-center gap-1.5 px-3.5 py-2 gradient-ningyuzhi text-green-950 rounded-xl font-black text-sm hover:scale-[1.03] transition-transform disabled:opacity-50"
                  title="恢复到原分区"
                >
                  {busyId === item.id ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                  恢复
                </button>
                <button
                  onClick={() => handlePermanentDelete(item)}
                  disabled={busyId === item.id}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
                  title="永久删除"
                >
                  <Trash2 size={15} />
                  永久删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

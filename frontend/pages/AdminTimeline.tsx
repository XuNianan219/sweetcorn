import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  getTimelineEntries,
  deleteTimelineEntry,
  type TimelineEntry,
} from '../services/timelineEntriesService';
import PageHeader from '../components/PageHeader';
import { showSuccess } from '../utils/toast';

export const AdminTimeline: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getTimelineEntries()
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (entry: TimelineEntry) => {
    if (!window.confirm(`确定删除「${entry.title}」吗？此操作不可恢复`)) return;
    setBusyId(entry.id);
    try {
      await deleteTimelineEntry(entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      showSuccess('已删除');
    } catch {
      /* 错误已由 apiClient toast */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 animate-fadeIn">
      <PageHeader
        title="日记管理"
        onBack={() => navigate('/timeline')}
        rightSlot={
          <button
            onClick={() => navigate('/admin/timeline/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-yellow-300 font-black rounded-2xl shadow-md hover:bg-green-800 transition-colors text-sm"
          >
            <Plus size={16} />
            新建条目
          </button>
        }
      />


      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 size={26} className="animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center border-4 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/40 text-gray-400 font-bold">
          还没有条目，点右上角「新建条目」添加
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, idx) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-green-50 shadow-sm"
            >
              <div className="w-9 h-9 rounded-full gradient-ningyuzhi flex items-center justify-center font-bold text-green-800 shrink-0">
                {idx + 1}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-green-600">{entry.date}</span>
                  {!entry.isPublished && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      未发布
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 font-medium">排序 {entry.orderNum}</span>
                </div>
                <h3 className="font-black text-gray-800 truncate">{entry.title}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/admin/timeline/${entry.id}/edit`)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                >
                  <Pencil size={13} /> 编辑
                </button>
                <button
                  onClick={() => handleDelete(entry)}
                  disabled={busyId === entry.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {busyId === entry.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

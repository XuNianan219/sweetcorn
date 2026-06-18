import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadMedia } from '../services/mediaService';
import {
  createTimelineEntry,
  getTimelineEntry,
  updateTimelineEntry,
} from '../services/timelineEntriesService';
import { LoadingButton } from '../components/LoadingButton';
import PageHeader from '../components/PageHeader';
import { showSuccess, showError } from '../utils/toast';

export const AdminTimelineForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [orderNum, setOrderNum] = useState<number>(100);
  const [isPublished, setIsPublished] = useState(true);

  const [loading, setLoading] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    getTimelineEntry(id)
      .then((e) => {
        if (cancelled) return;
        setDate(e.date);
        setTitle(e.title);
        setSummary(e.summary);
        setContent(e.content);
        setImage(e.image);
        setOrderNum(e.orderNum);
        setIsPublished(e.isPublished);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('只能上传图片');
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadMedia(file);
      setImage(url);
    } catch (err: any) {
      showError(err?.message || '图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!date.trim()) {
      showError('请填写日期');
      return;
    }
    if (!title.trim()) {
      showError('请填写标题');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date: date.trim(),
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        image,
        orderNum: Number(orderNum) || 0,
        isPublished,
      };
      if (isEdit && id) {
        await updateTimelineEntry(id, payload);
      } else {
        await createTimelineEntry(payload);
      }
      showSuccess('已保存');
      navigate('/timeline');
    } catch {
      /* 错误已由 apiClient toast */
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-gray-400">
        <Loader2 size={26} className="animate-spin" />
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-4 focus:ring-green-100 font-medium text-sm';
  const labelClass = 'text-xs font-black text-gray-400 uppercase tracking-wider';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-fadeIn">
      <PageHeader onBack={() => navigate('/timeline')} />

      <h1 className="text-2xl font-black text-green-950">{isEdit ? '编辑时间线条目' : '新建时间线条目'}</h1>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className={labelClass}>日期 *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>标题 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：初遇"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>简短描述（卡片显示）</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            placeholder="时间线卡片上的一句话描述"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>详细内容（详情页显示）</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="详情页的完整内容，支持换行"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>配图（单图）</label>
          {image ? (
            <div className="relative w-full max-w-sm rounded-xl overflow-hidden bg-gray-100">
              <img src={image} alt="" className="w-full object-cover" />
              <button
                type="button"
                onClick={() => setImage('')}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              {uploading ? '上传中…' : '上传配图'}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>排序号</label>
            <input
              type="number"
              value={orderNum}
              onChange={(e) => setOrderNum(e.target.value === '' ? 0 : Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 accent-green-600"
              />
              发布（在甜玉米日记显示）
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <LoadingButton loading={saving} onClick={handleSave}>
            保存
          </LoadingButton>
          <button
            type="button"
            onClick={() => navigate('/timeline')}
            className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

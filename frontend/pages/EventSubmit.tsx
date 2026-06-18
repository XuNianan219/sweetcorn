import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ImagePlus, Loader2, Send, X } from 'lucide-react';
import { submitEvent, type EventType } from '../services/eventsService';
import { uploadMedia } from '../services/mediaService';
import PageHeader from '../components/PageHeader';

const TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'performance', label: '演出行程' },
  { value: 'merchandise', label: '周边发售' },
  { value: 'endorsement', label: '代言公益' },
];

const CELEBS = ['梓渝', '田栩宁'];

export const EventSubmit: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('performance');
  const [celebrities, setCelebrities] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [location, setLocation] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [externalUrl, setExternalUrl] = useState('');

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPerformance = eventType === 'performance';

  const toggleCeleb = (c: string) => {
    setCelebrities((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const r = await uploadMedia(file);
      setCoverImage(r.url);
    } catch (err: any) {
      setError(err?.message || '封面上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('请填写活动标题');
    if (!startAt) return setError('请选择开始时间');
    if (isPerformance && !location.trim()) return setError('演出类活动必须填写地点');

    setSubmitting(true);
    try {
      await submitEvent({
        title: title.trim(),
        description: description.trim(),
        eventType,
        coverImage,
        location: location.trim(),
        startAt: new Date(startAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        externalUrl: externalUrl.trim(),
        celebrities,
      });
      setToast('已提交，等待管理员审核');
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err: any) {
      setError(err?.message || '提交失败');
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-100 outline-none font-medium placeholder:text-gray-300';

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-16 animate-fadeIn">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-bold z-50 shadow-lg">
          {toast}
        </div>
      )}

      <PageHeader />

      <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-6 md:p-8 space-y-5">
        <div>
          <h1 className="text-2xl font-black text-green-950">提交活动</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">提交后需管理员审核才会公开展示</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-bold">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* 标题 */}
        <Field label="活动标题" required>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：梓渝巡回演唱会·北京站" className={inputCls} />
        </Field>

        {/* 类型 */}
        <Field label="活动类型" required>
          <select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)} className={inputCls}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        {/* 明星 */}
        <Field label="涉及明星">
          <div className="flex gap-2">
            {CELEBS.map((c) => {
              const on = celebrities.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCeleb(c)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    on ? 'gradient-ningyuzhi text-green-950' : 'bg-gray-50 text-gray-500 hover:text-green-600'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Field>

        {/* 描述 */}
        <Field label="详细描述">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="活动详情、注意事项等"
            className={`${inputCls} h-28 resize-none`}
          />
        </Field>

        {/* 封面 */}
        <Field label="封面图">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          {coverImage ? (
            <div className="relative w-40">
              <img src={coverImage} alt="封面" className="w-40 h-28 object-cover rounded-xl border border-gray-100" />
              <button
                type="button"
                onClick={() => setCoverImage('')}
                className="absolute -top-2 -right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 text-green-700 bg-green-50 hover:bg-green-100 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              {uploading ? '上传中…' : '上传封面'}
            </button>
          )}
        </Field>

        {/* 地点 */}
        <Field label="地点" required={isPerformance}>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={isPerformance ? '演出类必填，如：北京·国家体育馆' : '可选'}
            className={inputCls}
          />
        </Field>

        {/* 时间 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="开始时间" required>
            <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={inputCls} />
          </Field>
          <Field label="结束时间（可选）">
            <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className={inputCls} />
          </Field>
        </div>

        {/* 链接 */}
        <Field label="购买/购票链接（可选）">
          <input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." className={inputCls} />
        </Field>

        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full py-3.5 gradient-ningyuzhi text-green-950 font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform disabled:opacity-50"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          提交审核
        </button>
      </form>
    </div>
  );
};

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label,
  required,
  children,
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-500 block">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

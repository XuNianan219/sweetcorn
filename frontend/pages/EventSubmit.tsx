import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ImagePlus, Loader2, Send, X } from 'lucide-react';
import { submitEvent, type EventType } from '../services/eventsService';
import { uploadMedia } from '../services/mediaService';
import PageHeader from '../components/PageHeader';
import { useLang } from '../contexts/LanguageContext';

const TYPE_OPTIONS: { value: EventType; label: string; labelEn: string }[] = [
  { value: 'performance', label: '演出行程', labelEn: 'Show schedule' },
  { value: 'merchandise', label: '周边发售', labelEn: 'Merch drop' },
  { value: 'endorsement', label: '代言公益', labelEn: 'Deal / charity' },
];

const CELEBS: { value: string; labelEn: string }[] = [
  { value: '梓渝', labelEn: 'Ziyu' },
  { value: '田栩宁', labelEn: 'Tianxuning' },
];

export const EventSubmit: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLang();

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
      setError(err?.message || t('封面上传失败', 'Cover upload failed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError(t('请填写活动标题', 'Please enter an event title'));
    if (!startAt) return setError(t('请选择开始时间', 'Please choose a start time'));
    if (isPerformance && !location.trim()) return setError(t('演出类活动必须填写地点', 'Shows require a location'));

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
      setToast(t('已提交，等待管理员审核', 'Submitted — awaiting admin review'));
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err: any) {
      setError(err?.message || t('提交失败', 'Submission failed'));
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
          <h1 className="text-2xl font-black text-green-950">{t('提交活动', 'Submit Event')}</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">{t('提交后需管理员审核才会公开展示', 'Needs admin review before going public')}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-bold">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* 标题 */}
        <Field label={t('活动标题', 'Event title')} required>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('例：梓渝巡回演唱会·北京站', 'e.g. Ziyu Tour · Beijing')} className={inputCls} />
        </Field>

        {/* 类型 */}
        <Field label={t('活动类型', 'Event type')} required>
          <select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)} className={inputCls}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.label, o.labelEn)}
              </option>
            ))}
          </select>
        </Field>

        {/* 明星 */}
        <Field label={t('涉及明星', 'Featured stars')}>
          <div className="flex gap-2">
            {CELEBS.map((c) => {
              const on = celebrities.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => toggleCeleb(c.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    on ? 'gradient-ningyuzhi text-green-950' : 'bg-gray-50 text-gray-500 hover:text-green-600'
                  }`}
                >
                  {t(c.value, c.labelEn)}
                </button>
              );
            })}
          </div>
        </Field>

        {/* 描述 */}
        <Field label={t('详细描述', 'Description')}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('活动详情、注意事项等', 'Event details, notes, etc.')}
            className={`${inputCls} h-28 resize-none`}
          />
        </Field>

        {/* 封面 */}
        <Field label={t('封面图', 'Cover image')}>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          {coverImage ? (
            <div className="relative w-40">
              <img src={coverImage} alt={t('封面', 'Cover')} className="w-40 h-28 object-cover rounded-xl border border-gray-100" />
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
              {uploading ? t('上传中…', 'Uploading…') : t('上传封面', 'Upload cover')}
            </button>
          )}
        </Field>

        {/* 地点 */}
        <Field label={t('地点', 'Location')} required={isPerformance}>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={isPerformance ? t('演出类必填，如：北京·国家体育馆', 'Required for shows, e.g. Beijing · National Stadium') : t('可选', 'Optional')}
            className={inputCls}
          />
        </Field>

        {/* 时间 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('开始时间', 'Start time')} required>
            <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={inputCls} />
          </Field>
          <Field label={t('结束时间（可选）', 'End time (optional)')}>
            <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className={inputCls} />
          </Field>
        </div>

        {/* 链接 */}
        <Field label={t('购买/购票链接（可选）', 'Buy/ticket link (optional)')}>
          <input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." className={inputCls} />
        </Field>

        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full py-3.5 gradient-ningyuzhi text-green-950 font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform disabled:opacity-50"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {t('提交审核', 'Submit for review')}
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

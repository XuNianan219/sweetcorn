import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Film, ImagePlus, Loader2, X } from 'lucide-react';
import { uploadMedia } from '../services/mediaService';
import { LoadingButton } from '../components/LoadingButton';
import PageHeader from '../components/PageHeader';
import { showSuccess, showError } from '../utils/toast';
import { useLang } from '../contexts/LanguageContext';
import {
  getExperience,
  createExperience,
  updateExperience,
  getRoutes,
  createRoute,
  updateRoute,
} from '../services/travelService';

export const AdminTravelForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isRoute = location.pathname.includes('/route');
  const isEdit = !!id;
  const navigate = useNavigate();
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 与后端 multer 限制保持一致（图片从严控、视频上限 100MB）
  const MAX_IMAGE_MB = 10;
  const MAX_VIDEO_MB = 100;

  // 通用字段
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [detailUrl, setDetailUrl] = useState('');
  const [orderNum, setOrderNum] = useState<number>(100);
  const [isPublished, setIsPublished] = useState(true);
  // 体验专属
  const [celebrity, setCelebrity] = useState('');
  const [category, setCategory] = useState('');
  const [locationField, setLocationField] = useState('');
  const [duration, setDuration] = useState('');
  const [vlogUrl, setVlogUrl] = useState('');
  // 线路专属
  const [subtitle, setSubtitle] = useState('');

  const [loading, setLoading] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [vlogUploading, setVlogUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    const run = async () => {
      try {
        if (isRoute) {
          const all = await getRoutes(true);
          const r = all.find((x) => x.id === id);
          if (r && !cancelled) {
            setTitle(r.title);
            setSubtitle(r.subtitle);
            setDescription(r.description);
            setCoverImage(r.coverImage);
            setDetailUrl(r.detailUrl);
            setOrderNum(r.orderNum);
            setIsPublished(r.isPublished);
          }
        } else {
          const e = await getExperience(id);
          if (!cancelled) {
            setCelebrity(e.celebrity);
            setTitle(e.title);
            setCategory(e.category);
            setLocationField(e.location);
            setDuration(e.duration);
            setDescription(e.description);
            setCoverImage(e.coverImage);
            setVlogUrl(e.vlogUrl);
            setDetailUrl(e.detailUrl);
            setOrderNum(e.orderNum);
            setIsPublished(e.isPublished);
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, isRoute]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError(t('只能上传图片', 'Images only'));
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      showError(t(`图片不能超过 ${MAX_IMAGE_MB}MB`, `Image must be under ${MAX_IMAGE_MB}MB`));
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadMedia(file);
      setCoverImage(url);
    } catch (err: any) {
      showError(err?.message || t('图片上传失败', 'Image upload failed'));
    } finally {
      setUploading(false);
    }
  };

  // VLOG 视频上传（复用同一套 R2 接口 uploadMedia）
  const handleVlogUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showError(t('只能上传视频', 'Videos only'));
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      showError(t(`视频不能超过 ${MAX_VIDEO_MB}MB`, `Video must be under ${MAX_VIDEO_MB}MB`));
      return;
    }
    setVlogUploading(true);
    try {
      const { url } = await uploadMedia(file);
      setVlogUrl(url);
    } catch (err: any) {
      showError(err?.message || t('视频上传失败', 'Video upload failed'));
    } finally {
      setVlogUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showError(t('请填写标题', 'Please enter a title'));
      return;
    }
    setSaving(true);
    try {
      if (isRoute) {
        const payload = {
          title: title.trim(),
          subtitle: subtitle.trim(),
          description: description.trim(),
          coverImage,
          detailUrl: detailUrl.trim(),
          orderNum: Number(orderNum) || 0,
          isPublished,
        };
        if (isEdit && id) await updateRoute(id, payload);
        else await createRoute(payload);
      } else {
        const payload = {
          celebrity: celebrity.trim(),
          title: title.trim(),
          category: category.trim(),
          location: locationField.trim(),
          duration: duration.trim(),
          description: description.trim(),
          coverImage,
          vlogUrl: vlogUrl.trim(),
          detailUrl: detailUrl.trim(),
          orderNum: Number(orderNum) || 0,
          isPublished,
        };
        if (isEdit && id) await updateExperience(id, payload);
        else await createExperience(payload);
      }
      showSuccess(t('已保存', 'Saved'));
      navigate('/admin/travel');
    } catch (err: any) {
      showError(err?.message || t('保存失败', 'Save failed'));
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

  const inputClass = 'w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-4 focus:ring-green-100 font-medium text-sm';
  const labelClass = 'text-xs font-black text-gray-400 uppercase tracking-wider';

  const heading = isRoute
    ? isEdit
      ? t('编辑精选线路', 'Edit route')
      : t('新建精选线路', 'New route')
    : isEdit
      ? t('编辑文化体验', 'Edit experience')
      : t('新建文化体验', 'New experience');

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-fadeIn">
      <PageHeader onBack={() => navigate('/admin/travel')} />
      <h1 className="text-2xl font-black text-green-950">{heading}</h1>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className={labelClass}>{t('标题 *', 'Title *')}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isRoute ? t('例如：江南水乡 · 3 日慢游', 'e.g. Jiangnan · 3-Day Trip') : t('例如：苏州缂丝体验', 'e.g. Suzhou Silk Weaving')} className={inputClass} />
        </div>

        {isRoute ? (
          <div className="space-y-1.5">
            <label className={labelClass}>{t('副标题', 'Subtitle')}</label>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder={t('例如：周庄 · 乌镇 · 西塘', 'e.g. Zhouzhuang · Wuzhen')} className={inputClass} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>{t('关联明星', 'Celebrity')}</label>
                <input value={celebrity} onChange={(e) => setCelebrity(e.target.value)} placeholder={t('如 梓渝', 'e.g. Ziyu')} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>{t('类目', 'Category')}</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('如 非遗·手工', 'e.g. Heritage')} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>{t('地点', 'Location')}</label>
                <input value={locationField} onChange={(e) => setLocationField(e.target.value)} placeholder={t('如 苏州吴中区', 'e.g. Suzhou')} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>{t('时长', 'Duration')}</label>
                <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder={t('如 半日', 'e.g. Half day')} className={inputClass} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>{t('Vlog（可选）', 'Vlog (optional)')}</label>
              {/* 方式一：手动粘贴链接 */}
              <input value={vlogUrl} onChange={(e) => setVlogUrl(e.target.value)} placeholder={t('粘贴视频链接 https://...', 'Paste a video link https://...')} className={inputClass} />
              {/* 方式二：从设备上传视频（走同一套 R2 接口） */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={vlogUploading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  {vlogUploading ? <Loader2 size={16} className="animate-spin" /> : <Film size={16} />}
                  {vlogUploading ? t('上传中…', 'Uploading…') : t('从设备上传视频', 'Upload video from device')}
                </button>
                {vlogUrl && !vlogUploading && (
                  <button type="button" onClick={() => setVlogUrl('')} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">
                    {t('清除', 'Clear')}
                  </button>
                )}
              </div>
              {vlogUrl && (
                <video src={vlogUrl} controls playsInline className="w-full max-w-sm rounded-xl border border-gray-100 bg-black max-h-56" />
              )}
              <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVlogUpload} className="hidden" />
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <label className={labelClass}>{t('描述', 'Description')}</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder={t('详细介绍', 'Details')} className={`${inputClass} resize-none`} />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>{t('详情/购买链接（可选）', 'Detail/buy link (optional)')}</label>
          <input value={detailUrl} onChange={(e) => setDetailUrl(e.target.value)} placeholder="https://..." className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>{t('封面图', 'Cover image')}</label>
          {coverImage ? (
            <div className="relative w-full max-w-sm rounded-xl overflow-hidden bg-gray-100">
              <img src={coverImage} alt="" className="w-full object-cover" />
              <button type="button" onClick={() => setCoverImage('')} className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors disabled:opacity-50">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              {uploading ? t('上传中…', 'Uploading…') : t('上传封面', 'Upload cover')}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>{t('排序号', 'Order')}</label>
            <input type="number" value={orderNum} onChange={(e) => setOrderNum(e.target.value === '' ? 0 : Number(e.target.value))} className={inputClass} />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-600 cursor-pointer">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4 accent-green-600" />
              {t('发布（普通用户可见）', 'Publish (visible to users)')}
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <LoadingButton loading={saving} onClick={handleSave}>
            {t('保存', 'Save')}
          </LoadingButton>
          <button type="button" onClick={() => navigate('/admin/travel')} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">
            {t('取消', 'Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Film, Loader2, Upload, X } from 'lucide-react';
import { uploadMedia } from '../services/mediaService';
import { submitProduct } from '../services/merchandiseService';
import PageHeader from '../components/PageHeader';
import { showSuccess, showError } from '../utils/toast';
import { useLang } from '../contexts/LanguageContext';

const MAX_IMAGES = 6;

interface PrefillState {
  name?: string;
  description?: string;
  imageUrls?: string[];
}

export const MerchandiseProductSubmit: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as PrefillState | null) || {};
  const { t } = useLang();
  const imgInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(prefill.name || '');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState(prefill.description || '');
  const [imageUrls, setImageUrls] = useState<string[]>(
    Array.isArray(prefill.imageUrls) ? prefill.imageUrls.slice(0, MAX_IMAGES) : [],
  );
  const [videoUrl, setVideoUrl] = useState('');
  const [tags, setTags] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    e.target.value = '';
    if (!files.length) return;
    if (imageUrls.length + files.length > MAX_IMAGES) {
      showError(t(`最多上传 ${MAX_IMAGES} 张图片`, `Upload up to ${MAX_IMAGES} images`));
      return;
    }
    setUploadingImg(true);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadMedia(f)));
      setImageUrls((prev) => [...prev, ...uploaded.map((u) => u.url)]);
    } catch (err: any) {
      showError(err?.message || t('图片上传失败', 'Image upload failed'));
    } finally {
      setUploadingImg(false);
    }
  };

  const handleVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showError(t('请选择视频文件', 'Please select a video file'));
      return;
    }
    setUploadingVideo(true);
    try {
      const { url } = await uploadMedia(file);
      setVideoUrl(url);
    } catch (err: any) {
      showError(err?.message || t('视频上传失败', 'Video upload failed'));
    } finally {
      setUploadingVideo(false);
    }
  };

  const removeImage = (idx: number) => setImageUrls((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!name.trim()) {
      showError(t('请填写商品名称', 'Please enter a product name'));
      return;
    }
    if (price === '' || Number(price) < 0) {
      showError(t('请填写正确的价格', 'Please enter a valid price'));
      return;
    }
    if (imageUrls.length === 0) {
      showError(t('至少上传一张商品图片', 'Upload at least one product image'));
      return;
    }
    setSubmitting(true);
    try {
      const tagList: string[] = Array.from(
        new Set(
          tags
            .split(/[,，]/)
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      );
      const p = await submitProduct({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        imageUrls,
        videoUrl,
        tags: tagList,
      });
      showSuccess(t('商品已上架！', 'Product listed!'));
      navigate(`/merchandise/product/${p.id}`);
    } catch (err: any) {
      showError(err?.message || t('上架失败', 'Listing failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-4 focus:ring-green-100 font-medium text-sm';
  const labelCls = 'text-xs font-black text-gray-400 uppercase tracking-wider';

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 animate-fadeIn">
      <PageHeader title={t('上架商品', 'List Item')} />

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className={labelCls}>{t('商品名称 *', 'Product name *')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('例如：梓渝同款应援棒', 'e.g. Ziyu lightstick')} className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>{t('价格（元）*', 'Price (¥) *')}</label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0"
            className={inputCls}
          />
        </div>

        {/* 商品图片 */}
        <div className="space-y-1.5">
          <label className={labelCls}>{t(`商品图片（最多 ${MAX_IMAGES} 张）*`, `Product images (up to ${MAX_IMAGES}) *`)}</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {imageUrls.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                disabled={uploadingImg}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-green-300 hover:text-green-500 transition-colors disabled:opacity-50"
              >
                {uploadingImg ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                <span className="text-xs">{uploadingImg ? t('上传中', 'Uploading') : t('添加图片', 'Add image')}</span>
              </button>
            )}
          </div>
          <input ref={imgInputRef} type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
        </div>

        {/* 宣传视频 */}
        <div className="space-y-1.5">
          <label className={labelCls}>{t('宣传视频（可选，展示在主图上方）', 'Promo video (optional, shown above main image)')}</label>
          {videoUrl ? (
            <div className="relative w-full max-w-sm rounded-xl overflow-hidden bg-black">
              <video src={videoUrl} controls playsInline className="w-full max-h-56" />
              <button
                type="button"
                onClick={() => setVideoUrl('')}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingVideo}
              className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              {uploadingVideo ? <Loader2 size={16} className="animate-spin" /> : <Film size={16} />}
              {uploadingVideo ? t('上传中…', 'Uploading…') : t('上传宣传视频', 'Upload promo video')}
            </button>
          )}
          <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideo} className="hidden" />
        </div>

        {/* 描述 */}
        <div className="space-y-1.5">
          <label className={labelCls}>{t('商品描述', 'Description')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={t('材质、尺寸、发货方式等', 'Material, size, shipping, etc.')}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* 标签（逗号分隔，用于推荐） */}
        <div className="space-y-1.5">
          <label className={labelCls}>{t('标签（逗号分隔，可选）', 'Tags (comma-separated, optional)')}</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t('例如：应援棒, 演唱会, 梓渝', 'e.g. lightstick, concert, Ziyu')}
            className={inputCls}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || uploadingImg || uploadingVideo}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-black text-base rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 size={18} className="animate-spin" />}
          {submitting ? t('上架中…', 'Listing…') : t('上架商品', 'List Item')}
        </button>
      </div>
    </div>
  );
};

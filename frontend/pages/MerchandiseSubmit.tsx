import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { uploadMedia } from '../services/mediaService';
import { submitIdea } from '../services/merchandiseService';
import PageHeader from '../components/PageHeader';
import { useLang } from '../contexts/LanguageContext';

export const MerchandiseSubmit: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | ''>('');
  const [targetPeople, setTargetPeople] = useState<number | ''>(50);
  const [designImages, setDesignImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    if (!files.length) return;
    if (designImages.length + files.length > 5) {
      setError(t('最多上传 5 张图片', 'Upload up to 5 images'));
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadMedia(f)));
      setDesignImages((prev) => [...prev, ...uploaded.map((u) => u.url)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('上传失败', 'Upload failed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setDesignImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError(t('请填写创意名称', 'Please enter an idea name')); return; }
    if (!description.trim()) { setError(t('请填写设计描述', 'Please enter a design description')); return; }
    if (Number(targetPeople) < 10) { setError(t('目标成团人数至少 10 人', 'Group goal must be at least 10 people')); return; }

    setSubmitting(true);
    setError(null);
    try {
      await submitIdea({
        name: name.trim(),
        description: description.trim(),
        designImages,
        estimatedCost: Number(estimatedCost) || 0,
        targetPeople: Number(targetPeople) || 50,
      });
      setSuccess(true);
      setTimeout(() => navigate('/category/merchandise'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('提交失败，请重试', 'Submission failed, please retry'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <PageHeader />
      <div>
        <h1 className="text-2xl font-black text-gray-900">{t('提交我的创意', 'Submit My Idea')}</h1>
        <p className="text-sm text-gray-400 mt-1">{t('你的设计可能成为下一个爆款周边', 'Your design could be the next hit merch')}</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 font-medium text-sm">
          {t('🎉 创意已提交，等待管理员审核通过后将上架众筹！正在返回...', '🎉 Idea submitted — it will go live for crowdfunding once an admin approves it! Returning...')}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 创意名称 */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
            {t('创意名称 *', 'Idea name *')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('例如：梓渝玩偶定制', 'e.g. Custom Ziyu plushie')}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-4 focus:ring-green-100 font-medium text-sm"
            required
          />
        </div>

        {/* 设计图上传 */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
            {t('设计图（最多 5 张）', 'Design images (max 5)')}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {designImages.map((url, idx) => (
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
            {designImages.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-green-300 hover:text-green-500 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <span className="text-xs">{t('上传中...', 'Uploading...')}</span>
                ) : (
                  <>
                    <Upload size={18} />
                    <span className="text-xs">{t('添加图片', 'Add image')}</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* 设计描述 */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
            {t('设计描述 *', 'Design description *')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('详细描述你的创意设计，材质、尺寸、风格等...', 'Describe your design — materials, size, style, etc...')}
            rows={4}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-4 focus:ring-green-100 font-medium text-sm resize-none"
            required
          />
        </div>

        {/* 成本 & 人数 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
              {t('预估成本（元/件）', 'Est. cost (¥/item)')}
            </label>
            <input
              type="number"
              min="0"
              value={estimatedCost}
              onChange={(e) =>
                setEstimatedCost(e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder="0"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-4 focus:ring-green-100 font-medium text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
              {t('目标成团人数（≥10）', 'Group goal (≥10)')}
            </label>
            <input
              type="number"
              min="10"
              value={targetPeople}
              onChange={(e) =>
                setTargetPeople(e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder="50"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-4 focus:ring-green-100 font-medium text-sm"
            />
          </div>
        </div>

        {/* 提交 */}
        <button
          type="submit"
          disabled={submitting || uploading || success}
          className="w-full py-4 bg-green-700 text-yellow-300 font-black text-base rounded-2xl hover:bg-green-800 transition-colors disabled:opacity-50 shadow-md"
        >
          {submitting ? t('提交中...', 'Submitting...') : t('提交创意', 'Submit idea')}
        </button>
      </form>
    </div>
  );
};

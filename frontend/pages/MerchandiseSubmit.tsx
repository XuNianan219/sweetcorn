import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { uploadMedia } from '../services/mediaService';
import { submitIdea } from '../services/merchandiseService';

export const MerchandiseSubmit: React.FC = () => {
  const navigate = useNavigate();
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
      setError('最多上传 5 张图片');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadMedia(f)));
      setDesignImages((prev) => [...prev, ...uploaded.map((u) => u.url)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
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
    if (!name.trim()) { setError('请填写创意名称'); return; }
    if (!description.trim()) { setError('请填写设计描述'); return; }
    if (Number(targetPeople) < 10) { setError('目标成团人数至少 10 人'); return; }

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
      setError(err instanceof Error ? err.message : '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-black text-gray-900">提交我的创意</h1>
        <p className="text-sm text-gray-400 mt-1">你的设计可能成为下一个爆款周边</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 font-medium text-sm">
          🎉 创意提交成功，等待粉丝凑团！正在返回...
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
            创意名称 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：梓渝玩偶定制"
            className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-4 focus:ring-green-100 font-medium text-sm"
            required
          />
        </div>

        {/* 设计图上传 */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
            设计图（最多 5 张）
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
                  <span className="text-xs">上传中...</span>
                ) : (
                  <>
                    <Upload size={18} />
                    <span className="text-xs">添加图片</span>
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
            设计描述 *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="详细描述你的创意设计，材质、尺寸、风格等..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-4 focus:ring-green-100 font-medium text-sm resize-none"
            required
          />
        </div>

        {/* 成本 & 人数 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
              预估成本（元/件）
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
              目标成团人数（≥10）
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
          {submitting ? '提交中...' : '提交创意'}
        </button>
      </form>
    </div>
  );
};

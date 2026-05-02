import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, PlusCircle, X } from 'lucide-react';
import { createPost } from '../services/postsApi';
import { uploadMedia } from '../services/mediaService';
import { getCategoryName } from '../constants/categories';

interface PostComposerProps {
  category: string;
  onPosted?: () => void;
  placeholder?: string;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  category,
  onPosted,
  placeholder,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryName = getCategoryName(category);
  const ph = placeholder ?? `在${categoryName}发一条动态…支持 #话题标签`;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files) as File[]) {
        const r = await uploadMedia(file);
        urls.push(r.url);
      }
      setImages((prev) => [...prev, ...urls]);
    } catch (err: any) {
      setError(err?.message || '图片上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || submitting || uploading) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPost({
        title: title.trim(),
        content: content.trim(),
        category,
        mediaUrls: images,
        mediaType: images.length > 0 ? 'image' : 'none',
      });
      setTitle('');
      setContent('');
      setImages([]);
      onPosted?.();
    } catch (err: any) {
      setError(err?.message || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-green-50 shadow-sm p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-green-950">发帖到「{categoryName}」</h3>
        <span className="text-xs text-gray-400 font-medium">支持 #话题</span>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="标题（可选）"
        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-100 outline-none text-base font-semibold placeholder:text-gray-300 transition-all"
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={ph}
        className="w-full h-28 p-4 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-100 outline-none resize-none text-base font-medium placeholder:text-gray-300 transition-all"
      />

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ImagePlus size={16} />
          )}
          {uploading ? '上传中…' : '添加图片'}
        </button>

        {images.map((url, idx) => (
          <div key={url} className="relative group/thumb">
            <img
              src={url}
              alt={`预览 ${idx + 1}`}
              className="w-16 h-16 object-cover rounded-lg border border-gray-100"
            />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <div className="flex-grow" />

        <button
          type="submit"
          disabled={!content.trim() || submitting || uploading}
          className="px-6 py-2.5 gradient-ningyuzhi text-green-950 font-black rounded-xl hover:scale-[1.03] transition-transform flex items-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
          发布
        </button>
      </div>
    </form>
  );
};

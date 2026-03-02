import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Ruler, Save, Sparkles, Upload, X } from 'lucide-react';
import { StorageService } from '../services/storage';

export const CelebB: React.FC = () => {
  const currentUser = StorageService.getCurrentUser();
  const isAdmin = StorageService.isAdmin(currentUser?.id);
  const [silhouetteUrl, setSilhouetteUrl] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    const saved = StorageService.getCelebSilhouette('b');
    if (saved) setSilhouetteUrl(saved);
  }, []);

  const saveSilhouette = async () => {
    if (!file || !currentUser?.id) return;
    const dataUrl = await fileToDataUrl(file);
    const ok = StorageService.setCelebSilhouette(currentUser.id, 'b', dataUrl);
    if (!ok) return;
    setSilhouetteUrl(dataUrl);
    setFile(null);
    setPreview('');
    setShowUploader(false);
  };

  const handlePasteSilhouette = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const pasted = items[i].getAsFile();
        if (!pasted) continue;
        setFile(pasted);
        setPreview(URL.createObjectURL(pasted));
        return;
      }
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-16">
      <section className="gradient-tian min-h-[560px] rounded-[3.2rem] p-10 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5" />
        {silhouetteUrl && (
          <img
            src={silhouetteUrl}
            className="absolute inset-0 w-full h-full object-contain z-[1] pointer-events-none drop-shadow-[0_25px_40px_rgba(0,0,0,0.25)]"
            alt="田栩宁人物剪影"
          />
        )}

        {isAdmin && (
          <button
            onClick={() => setShowUploader(true)}
            className="absolute top-6 right-6 z-20 px-4 py-2 rounded-xl bg-white/30 text-gray-900 border border-white/50 backdrop-blur-md font-black text-sm flex items-center gap-2"
          >
            <Upload size={14} />
            更换剪影
          </button>
        )}

        <div className="relative z-10 h-full flex items-end">
          <div className="space-y-4 text-gray-900">
            <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md px-4 py-1.5 rounded-full w-fit border border-white/50">
              <Sparkles size={16} className="text-yellow-600" />
              <span className="text-xs font-black tracking-widest uppercase">华策影视</span>
            </div>
            <h1 className="text-7xl md:text-8xl font-black drop-shadow-sm">
              田栩宁 <span className="text-3xl font-medium opacity-70">Xuning</span>
            </h1>
            <p className="text-gray-800 text-xl font-medium tracking-widest flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar size={20} />
                1997.09.19
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={20} />
                山东济宁
              </span>
              <span className="flex items-center gap-1">
                <Ruler size={20} />
                188cm
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-black text-gray-900">田栩宁展示页</h2>
        <p className="text-gray-500 mt-2">背景保持黄色主题，支持叠加透明人物剪影。仅管理员可更换剪影，其他用户只能查看。</p>
      </section>

      {showUploader && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onPaste={handlePasteSilhouette}>
          <div className="w-full max-w-xl bg-white rounded-[2rem] p-6 space-y-4 relative">
            <button onClick={() => setShowUploader(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
              <X size={22} />
            </button>
            <h3 className="text-2xl font-black text-gray-900">田栩宁剪影设置（管理员）</h3>
            <p className="text-sm text-gray-500">建议上传透明背景 PNG/WebP。支持文件选择和 Ctrl+V 粘贴。</p>
            <label className="w-full p-5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer flex items-center justify-center gap-2 text-gray-500 font-bold hover:border-yellow-300">
              <Upload size={16} />
              {file ? file.name : '选择透明剪影文件'}
              <input
                type="file"
                accept="image/png,image/webp,image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setFile(f);
                  setPreview(URL.createObjectURL(f));
                }}
              />
            </label>
            <div className="rounded-2xl overflow-hidden border border-white/30 bg-gradient-to-r from-yellow-300 to-yellow-100 h-72 relative flex items-center justify-center shadow-inner">
              {(preview || silhouetteUrl) && <img src={preview || silhouetteUrl} className="w-full h-full object-contain p-2" alt="preview" />}
              {!preview && !silhouetteUrl && <span className="text-gray-700/80 text-sm font-bold">剪影预览区</span>}
            </div>
            <button onClick={saveSilhouette} disabled={!file} className="w-full py-3 rounded-xl gradient-redsea text-white font-black flex items-center justify-center gap-2 disabled:opacity-50">
              <Save size={16} />
              保存剪影
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

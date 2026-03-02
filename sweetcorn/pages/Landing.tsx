import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Heart, Save, Settings, Upload, X } from 'lucide-react';
import { StorageService } from '../services/storage';

export const Landing: React.FC = () => {
  const currentUser = StorageService.getCurrentUser();
  const isAdmin = StorageService.isAdmin(currentUser.id);

  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [playbackError, setPlaybackError] = useState('');
  const objectUrlRef = useRef<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const nextUrl = await StorageService.getHomeVideoUrl();
      if (!mounted) return;
      if (objectUrlRef.current && objectUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = nextUrl;
      setVideoUrl(nextUrl);
      if (!selectedFile) setPreviewUrl(nextUrl);
      setPlaybackError('');
    };
    load();

    return () => {
      mounted = false;
      if (objectUrlRef.current && objectUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [selectedFile]);

  const saveVideoConfig = async () => {
    if (!selectedFile) return;
    const success = await StorageService.setHomeVideoFile(currentUser.id, selectedFile);
    if (!success) return;
    setSelectedFile(null);
    setShowConfig(false);
    const nextUrl = await StorageService.getHomeVideoUrl();
    if (objectUrlRef.current && objectUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = nextUrl;
    setVideoUrl(nextUrl);
    setPreviewUrl(nextUrl);
    setPlaybackError('');
  };

  const handlePickVideo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) return;
    setSelectedFile(file);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const nextPreview = URL.createObjectURL(file);
    previewUrlRef.current = nextPreview;
    setPreviewUrl(nextPreview);
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      <div className="absolute inset-0 z-0">
        {videoUrl ? (
          <video
            key={videoUrl}
            src={videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            onError={() => setPlaybackError('首页视频播放失败：请上传可播放的视频格式（推荐 MP4/H.264）。')}
          />
        ) : (
          <div className="w-full h-full bg-black" />
        )}
        <div className="absolute inset-0 bg-black/35" />
      </div>
      {playbackError && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-red-600/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg">
          {playbackError}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center text-white">
        <div className="space-y-10">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-tight drop-shadow-xl">
            甜玉米
            <br />
            成长乐园
          </h1>

          <div className="flex flex-wrap justify-center gap-5">
            <Link
              to="/timeline"
              className="px-10 py-4 bg-white text-gray-900 font-black text-lg rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
            >
              开启回忆
              <ChevronRight />
            </Link>
            <Link
              to="/discussion"
              className="px-10 py-4 bg-white/20 backdrop-blur-md border border-white/40 text-white font-black text-lg rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
            >
              进入交流区
              <Heart className="text-red-300 fill-current" size={20} />
            </Link>
          </div>
        </div>
      </div>

      {isAdmin && (
        <button
          onClick={() => setShowConfig(true)}
          className="absolute top-6 right-6 z-20 px-4 py-2 rounded-xl bg-white/20 text-white border border-white/40 backdrop-blur-md font-black text-sm flex items-center gap-2"
        >
          <Settings size={14} />
          更换首页视频
        </button>
      )}

      {showConfig && (
        <div className="fixed inset-0 z-[150] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-[2rem] p-6 space-y-4 relative">
            <button onClick={() => setShowConfig(false)} className="absolute right-4 top-4 text-gray-400 hover:text-red-500">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-gray-900">首页视频设置（管理员）</h2>
            <p className="text-sm text-gray-500">视频将存入浏览器 IndexedDB，可支持更大的本地文件。</p>
            <label className="w-full p-5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer flex items-center justify-center gap-2 text-gray-500 font-bold hover:border-green-200">
              <Upload size={16} />
              {selectedFile ? selectedFile.name : '选择本地视频文件'}
              <input type="file" accept="video/*" className="hidden" onChange={(e) => handlePickVideo(e.target.files?.[0])} />
            </label>
            <div className="aspect-video rounded-xl overflow-hidden border border-gray-100 bg-black">
              {previewUrl ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : null}
            </div>
            <button
              onClick={saveVideoConfig}
              disabled={!selectedFile}
              className="w-full py-3 rounded-xl gradient-redsea text-white font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              保存首页视频
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

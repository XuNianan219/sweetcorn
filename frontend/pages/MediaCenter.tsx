import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Copy, Globe2, Heart, ImageIcon, Link2, MessageCircleMore, MessageSquare, MoreHorizontal, Play, QrCode, Repeat2, Search, Send, Share2, Smartphone, Upload, X } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Comment, PhotoItem, VideoItem } from '../types';
import { MOCK_MERCH } from '../constants';

type MediaKind = 'photo' | 'video';
type MediaCard = {
  id: string;
  kind: MediaKind;
  title: string;
  author: string;
  likes: number;
  tags: string[];
  cover: string;
  creatorId: string;
  commentsList: Comment[];
  merchId?: string;
};

type ShareTarget = {
  id: string;
  label: string;
  hint: string;
  bgClass: string;
  icon: React.ReactNode;
  buildUrl: (item: MediaCard) => string;
};

const SHARE_TARGETS: ShareTarget[] = [
  {
    id: 'wechat',
    label: '微信',
    hint: '发给好友',
    bgClass: 'bg-[#1AAD19] text-white',
    icon: <MessageCircleMore size={20} />,
    buildUrl: (item) => `https://example.com/mock-share/wechat?title=${encodeURIComponent(item.title)}&id=${encodeURIComponent(item.id)}`
  },
  {
    id: 'moments',
    label: '朋友圈',
    hint: '同步动态',
    bgClass: 'bg-[#2CBF6E] text-white',
    icon: <Globe2 size={20} />,
    buildUrl: (item) => `https://example.com/mock-share/moments?title=${encodeURIComponent(item.title)}&id=${encodeURIComponent(item.id)}`
  },
  {
    id: 'weibo',
    label: '微博',
    hint: '公开转发',
    bgClass: 'bg-[#FF8200] text-white',
    icon: <Share2 size={20} />,
    buildUrl: (item) => `https://example.com/mock-share/weibo?title=${encodeURIComponent(item.title)}&id=${encodeURIComponent(item.id)}`
  },
  {
    id: 'qq',
    label: 'QQ',
    hint: '发给好友',
    bgClass: 'bg-[#12B7F5] text-white',
    icon: <Smartphone size={20} />,
    buildUrl: (item) => `https://example.com/mock-share/qq?title=${encodeURIComponent(item.title)}&id=${encodeURIComponent(item.id)}`
  },
  {
    id: 'qzone',
    label: 'QQ空间',
    hint: '一键发布',
    bgClass: 'bg-[#F5C542] text-gray-900',
    icon: <QrCode size={20} />,
    buildUrl: (item) => `https://example.com/mock-share/qzone?title=${encodeURIComponent(item.title)}&id=${encodeURIComponent(item.id)}`
  },
  {
    id: 'link',
    label: '复制链接',
    hint: '占位链接',
    bgClass: 'bg-gray-900 text-white',
    icon: <Copy size={20} />,
    buildUrl: (item) => `https://example.com/mock-share/link?title=${encodeURIComponent(item.title)}&id=${encodeURIComponent(item.id)}`
  }
];

export const MediaCenter: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = StorageService.getCurrentUser();

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set());
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<MediaKind>('photo');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadMerchId, setUploadMerchId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [menuItem, setMenuItem] = useState<MediaCard | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [shareItem, setShareItem] = useState<MediaCard | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setPhotos(StorageService.getPhotos());
    setVideos(StorageService.getVideos());
    setSavedIds(new Set(StorageService.getSavedMediaIds(currentUser.id)));
    setDislikedIds(new Set(StorageService.getDislikedMediaIds(currentUser.id)));
  };

  useEffect(() => {
    load();
  }, []);

  const items = useMemo<MediaCard[]>(() => {
    const p = photos.map((x) => ({ id: x.id, kind: 'photo' as const, title: x.title, author: x.author, likes: x.likes, tags: x.tags || [], cover: x.url, creatorId: x.creatorId, commentsList: x.commentsList || [] }));
    const v = videos.map((x) => ({ id: x.id, kind: 'video' as const, title: x.title, author: x.author, likes: x.likes, tags: x.tags || [], cover: x.cover, creatorId: x.creatorId, commentsList: x.commentsList || [], merchId: x.merchId }));
    return [...p, ...v]
      .filter((item) => !dislikedIds.has(`${item.kind}-${item.id}`))
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [photos, videos, dislikedIds]);

  const filtered = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return items;
    const tNoHash = t.replace('#', '');
    return items.filter((item) => item.title.toLowerCase().includes(t) || item.author.toLowerCase().includes(t) || item.tags.some((tag) => tag.toLowerCase().includes(t) || tag.toLowerCase().replace('#', '').includes(tNoHash)));
  }, [items, searchTerm]);

  const handleLike = (item: MediaCard) => {
    const key = `${item.kind}-${item.id}`;
    const next = new Set(likedIds);
    const isLiked = next.has(key);
    if (isLiked) next.delete(key);
    else next.add(key);
    setLikedIds(next);
    const nextLikes = Math.max(0, item.likes + (isLiked ? -1 : 1));
    if (item.kind === 'photo') {
      const target = photos.find((p) => p.id === item.id);
      if (!target) return;
      StorageService.updatePhoto({ ...target, likes: nextLikes });
    } else {
      const target = videos.find((v) => v.id === item.id);
      if (!target) return;
      StorageService.updateVideo({ ...target, likes: nextLikes });
    }
    load();
  };

  const handleComment = (item: MediaCard) => {
    const key = `${item.kind}-${item.id}`;
    const content = (commentDrafts[key] || '').trim();
    if (!content) return;
    const newComment: Comment = { id: Date.now().toString(), author: currentUser.realName, content, timestamp: '刚刚' };
    if (item.kind === 'photo') {
      const target = photos.find((p) => p.id === item.id);
      if (!target) return;
      StorageService.updatePhoto({ ...target, commentsList: [...(target.commentsList || []), newComment] });
    } else {
      const target = videos.find((v) => v.id === item.id);
      if (!target) return;
      StorageService.updateVideo({ ...target, commentsList: [...(target.commentsList || []), newComment] });
    }
    setCommentDrafts((prev) => ({ ...prev, [key]: '' }));
    load();
  };

  const handleRepost = (item: MediaCard) => {
    setShareItem(item);
    setShowMenu(false);
  };

  const handleShareTargetClick = (target: ShareTarget) => {
    if (!shareItem) return;
    window.open(target.buildUrl(shareItem), '_blank', 'noopener,noreferrer');
  };

  const handleDelete = (item: MediaCard) => {
    if (!window.confirm('确定删除这条内容吗？删除后会进入回收站。')) return;
    if (item.kind === 'photo') StorageService.removePhoto(item.id, currentUser.id);
    else StorageService.removeVideo(item.id, currentUser.id);
    setShowMenu(false);
    load();
  };

  const handleSave = (item: MediaCard) => {
    const key = `${item.kind}-${item.id}`;
    setSavedIds(new Set(StorageService.toggleSaveMedia(currentUser.id, key)));
    setShowMenu(false);
  };

  const handleDislike = (item: MediaCard) => {
    const key = `${item.kind}-${item.id}`;
    setDislikedIds(new Set(StorageService.addDislikedMedia(currentUser.id, key)));
    setShowMenu(false);
  };

  const handleFileChange = (file?: File) => {
    if (!file) return;
    if (uploadType === 'photo' && !file.type.startsWith('image/')) return setUploadError('图片发布仅支持图片文件');
    if (uploadType === 'video' && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) return setUploadError('视频发布仅支持视频/音频文件');
    setUploadError(null);
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const handlePasteUpload = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (uploadType !== 'photo') return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (!items[i].type.startsWith('image/')) continue;
      const pasted = items[i].getAsFile();
      if (pasted) {
        handleFileChange(pasted);
        return;
      }
    }
  };

  const resetUpload = () => {
    setShowUploadModal(false);
    setUploadType('photo');
    setUploadTitle('');
    setUploadTags('');
    setUploadMerchId('');
    setUploadFile(null);
    setUploadPreview(null);
    setUploadError(null);
    setIsUploading(false);
  };

  const submitUpload = async () => {
    if (!uploadTitle.trim() || !uploadFile || !uploadPreview) return setUploadError('请填写标题并选择文件');
    setIsUploading(true);
    await new Promise((r) => setTimeout(r, 400));
    const tags = uploadTags
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));
    if (uploadType === 'photo') {
      StorageService.savePhoto({ id: Date.now().toString(), creatorId: currentUser.id, title: uploadTitle.trim(), url: uploadPreview, author: currentUser.realName, likes: 0, tags: tags.length ? tags : ['#图片'], commentsList: [] });
    } else {
      StorageService.saveVideo({ id: Date.now().toString(), creatorId: currentUser.id, title: uploadTitle.trim(), author: currentUser.realName, likes: 0, comments: 0, cover: uploadPreview, mediaUrl: uploadPreview, tags: tags.length ? tags : ['#视频'], commentsList: [], merchId: uploadMerchId || undefined });
    }
    resetUpload();
    load();
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-white rounded-[2.5rem] p-8 border border-green-50 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-green-950">影像区</h1>
            <p className="text-sm text-gray-400 mt-1">图片和视频统一发布，支持标签搜索</p>
          </div>
          <button onClick={() => setShowUploadModal(true)} className="px-8 py-4 gradient-redsea text-white font-black rounded-2xl">
            发布内容
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={22} />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchTerm.trim().startsWith('#') && navigate(`/tags/${encodeURIComponent(searchTerm.trim().replace('#', ''))}`)} placeholder="搜索关键词或 #话题" className="w-full pl-16 pr-6 py-4 bg-gray-50 rounded-2xl outline-none border-none focus:ring-4 focus:ring-green-100 font-medium" />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
          {filtered.map((item, idx) => {
            const key = `${item.kind}-${item.id}`;
            const comments = item.commentsList || [];
            const offset = idx % 3 === 1 ? 'mt-5' : idx % 3 === 2 ? 'mt-2' : '';
            return (
              <article key={key} className={`break-inside-avoid mb-6 bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm ${offset}`}>
                <div className="relative">
                  {item.kind === 'video' && videos.find((v) => v.id === item.id)?.mediaUrl ? (
                    <video src={videos.find((v) => v.id === item.id)?.mediaUrl} className="w-full min-h-[220px] max-h-[500px] object-cover" controls />
                  ) : (
                    <img src={item.cover} alt={item.title} className="w-full min-h-[220px] max-h-[500px] object-cover" />
                  )}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-black bg-black/60 text-white flex items-center gap-1">
                    {item.kind === 'video' ? <Play size={12} /> : <ImageIcon size={12} />}
                    {item.kind === 'video' ? '视频' : '图片'}
                  </div>
                  <button onClick={() => { setMenuItem(item); setShowMenu(true); }} className="absolute top-3 right-3 p-2 rounded-full bg-black/45 text-white">
                    <MoreHorizontal size={15} />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="text-[15px] font-black text-gray-900">{item.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <button key={tag} onClick={() => navigate(`/tags/${encodeURIComponent(tag.replace('#', ''))}`)} className="text-[11px] bg-red-50 text-red-500 px-2 py-1 rounded-md font-bold">
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-bold">@{item.author}</span>
                    {savedIds.has(key) && <span className="text-[11px] text-green-700 font-black bg-green-50 px-2 py-1 rounded-md">已保存</span>}
                  </div>
                  <div className="flex items-center gap-5 text-gray-500">
                    <button onClick={() => handleLike(item)} className={`flex items-center gap-1 ${likedIds.has(key) ? 'text-red-500' : 'hover:text-red-500'}`}>
                      <Heart size={17} className={likedIds.has(key) ? 'fill-current' : ''} />
                      <span className="text-xs font-black">{item.likes}</span>
                    </button>
                    <button onClick={() => setActiveCommentId(activeCommentId === key ? null : key)} className={`flex items-center gap-1 ${activeCommentId === key ? 'text-blue-500' : 'hover:text-blue-500'}`}>
                      <MessageSquare size={17} />
                      <span className="text-xs font-black">{comments.length}</span>
                    </button>
                    <button onClick={() => handleRepost(item)} className="flex items-center gap-1 hover:text-green-600">
                      <Repeat2 size={17} />
                      <span className="text-xs font-black">转发</span>
                    </button>
                  </div>
                  {activeCommentId === key && (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {comments.map((c) => (
                          <div key={c.id} className="text-xs bg-gray-50 p-2 rounded-xl">
                            <span className="font-black text-green-700">{c.author}: </span>
                            {c.content}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2 pr-3">
                        <input value={commentDrafts[key] || ''} onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [key]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && handleComment(item)} placeholder="写评论..." className="flex-grow bg-transparent outline-none text-xs" />
                        <button onClick={() => handleComment(item)} className="text-green-700">
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-100 py-20 px-8 text-center space-y-4">
          <p className="text-2xl font-black text-gray-700">没有找到匹配内容</p>
          <p className="text-sm text-gray-400">试试换关键词，或输入 #话题 回车跳转</p>
          <button onClick={() => setSearchTerm('')} className="px-6 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-black">
            清空搜索
          </button>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onPaste={handlePasteUpload}>
          <div className="w-full max-w-xl bg-white rounded-[2.5rem] p-8 relative shadow-2xl space-y-6">
            <button onClick={resetUpload} className="absolute top-6 right-6 text-gray-400 hover:text-red-500">
              <X size={28} />
            </button>
            <h2 className="text-3xl font-black text-gray-900">发布内容</h2>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1.5 rounded-2xl">
              <button onClick={() => setUploadType('photo')} className={`py-3 rounded-xl font-black ${uploadType === 'photo' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-400'}`}>
                图片
              </button>
              <button onClick={() => setUploadType('video')} className={`py-3 rounded-xl font-black ${uploadType === 'video' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-400'}`}>
                视频
              </button>
            </div>
            <input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="输入标题" className="w-full p-4 rounded-2xl bg-gray-50 outline-none border-none focus:ring-4 focus:ring-green-100" />
            <input value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="输入话题标签，空格分隔" className="w-full p-4 rounded-2xl bg-gray-50 outline-none border-none focus:ring-4 focus:ring-green-100" />
            {uploadType === 'video' && (
              <select value={uploadMerchId} onChange={(e) => setUploadMerchId(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 outline-none border-none focus:ring-4 focus:ring-green-100">
                <option value="">不关联周边</option>
                {MOCK_MERCH.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            )}
            <button onClick={() => fileInputRef.current?.click()} className="w-full p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-green-200 bg-gray-50">
              <div className="text-gray-400 font-bold">{uploadFile ? uploadFile.name : uploadType === 'photo' ? '选择图片文件（支持 Ctrl+V 粘贴）' : '选择视频/音频文件'}</div>
              <input ref={fileInputRef} type="file" accept={uploadType === 'photo' ? 'image/*' : 'video/*,audio/*'} className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0])} />
            </button>
            {uploadType === 'photo' && uploadPreview && (
              <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white h-72 flex items-center justify-center">
                <img src={uploadPreview} alt="upload preview" className="w-full h-full object-contain" />
              </div>
            )}
            {uploadError && <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{uploadError}</div>}
            <button onClick={submitUpload} disabled={isUploading} className="w-full py-4 gradient-redsea text-white rounded-2xl font-black disabled:opacity-60">
              {isUploading ? '发布中...' : '确认发布'}
            </button>
          </div>
        </div>
      )}

      {showMenu && menuItem && (
        <div className="fixed inset-0 z-[170] bg-black/40 flex items-end justify-center p-4" onClick={() => setShowMenu(false)}>
          <div className="w-full max-w-md bg-white rounded-[2rem] p-4 space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-black text-gray-700 px-2 pb-2 border-b border-gray-100">{menuItem.title}</div>
            {menuItem.creatorId === currentUser.id ? (
              <>
                <button onClick={() => handleDelete(menuItem)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 font-bold text-red-600 text-left">
                  <X size={16} />
                  删除（进回收站）
                </button>
                <button onClick={() => handleSave(menuItem)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 font-bold text-left">
                  <Bookmark size={16} />
                  {savedIds.has(`${menuItem.kind}-${menuItem.id}`) ? '取消保存' : '保存'}
                </button>
                <button onClick={() => handleRepost(menuItem)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 font-bold text-left">
                  <Repeat2 size={16} />
                  转发
                </button>
              </>
            ) : (
              <button onClick={() => handleDislike(menuItem)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 font-bold text-left">
                <X size={16} />
                不喜欢
              </button>
            )}
          </div>
        </div>
      )}

      {shareItem && (
        <div className="fixed inset-0 z-[180] bg-black/55 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={() => setShareItem(null)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-[2.25rem] bg-[#f8f4ea] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,#fff3d8_0%,#ffe6cc_45%,#f8f4ea_100%)] px-6 py-6 md:px-8">
              <button onClick={() => setShareItem(null)} className="absolute right-5 top-5 text-gray-400 hover:text-red-500">
                <X size={24} />
              </button>
              <div className="flex items-start gap-4 pr-10">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[1.5rem] bg-white shadow-md">
                  <img src={shareItem.cover} alt={shareItem.title} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-black tracking-[0.2em] text-[#d35454] shadow-sm">
                    <Repeat2 size={14} />
                    SHARE
                  </div>
                  <h3 className="text-xl font-black text-gray-900 md:text-2xl">{shareItem.title}</h3>
                  <p className="text-sm font-medium text-gray-500">仿照短视频平台的转发面板。现在先接假链接，后续你可以把每个平台链接替换成真实地址。</p>
                </div>
              </div>
            </div>

            <div className="bg-white px-6 py-6 md:px-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-base font-black text-gray-900">分享到</p>
                  <p className="text-xs text-gray-400">点击图标会打开对应的占位网站</p>
                </div>
                <div className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-black text-gray-500">
                  当前为演示版
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
                {SHARE_TARGETS.map((target) => (
                  <button key={target.id} onClick={() => handleShareTargetClick(target)} className="group flex flex-col items-center gap-2 rounded-[1.5rem] bg-[#faf7f2] px-3 py-4 transition hover:-translate-y-1 hover:shadow-md">
                    <span className={`flex h-14 w-14 items-center justify-center rounded-[1.25rem] shadow-sm ${target.bgClass}`}>
                      {target.icon}
                    </span>
                    <span className="text-sm font-black text-gray-900">{target.label}</span>
                    <span className="text-[11px] text-gray-400">{target.hint}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-[#f1e8d8] bg-[#fffaf0] p-4">
                <div className="flex items-center gap-2 text-sm font-black text-gray-800">
                  <Link2 size={16} />
                  占位链接预览
                </div>
                <div className="mt-2 break-all text-xs text-gray-500">
                  https://example.com/mock-share/wechat?title={encodeURIComponent(shareItem.title)}&id={encodeURIComponent(shareItem.id)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

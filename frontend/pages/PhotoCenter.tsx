
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StorageService } from '../services/storage';
import { PhotoItem, Comment } from '../types';
import { Upload, Heart, X, Search, MessageSquare, Send, Maximize2, CheckCircle, Edit3, Archive, Hash, ImageIcon } from 'lucide-react';

export const PhotoCenter: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [previewPhoto, setPreviewPhoto] = useState<PhotoItem | null>(null);
  const [showToast, setShowToast] = useState<{msg: string} | null>(null);

  // Upload/Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = StorageService.getCurrentUser();
  const isAdmin = StorageService.isAdmin(currentUser?.id);

  const loadPhotos = useCallback(() => {
    setPhotos(StorageService.getPhotos());
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const triggerToast = (msg: string) => {
    setShowToast({ msg });
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setUploadFile(f);
      setUploadPreview(URL.createObjectURL(f));
    }
  };

  // Add Paste Support for Modal
  const handlePaste = (e: React.ClipboardEvent) => {
    if (!showUploadModal) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setUploadFile(file);
          setUploadPreview(URL.createObjectURL(file));
          triggerToast('已通过粘贴获取图片');
        }
      }
    }
  };

  const handleLike = (photo: PhotoItem) => {
    const isLiked = likedIds.has(photo.id);
    const updatedLikes = isLiked ? (photo.likes - 1) : (photo.likes + 1);
    const updated = { ...photo, likes: Math.max(0, updatedLikes) };
    
    const newLikedIds = new Set(likedIds);
    if (isLiked) newLikedIds.delete(photo.id);
    else newLikedIds.add(photo.id);
    setLikedIds(newLikedIds);

    StorageService.updatePhoto(updated);
    setPhotos(prev => prev.map(p => p.id === photo.id ? updated : p));
  };

  const handleAddComment = (photo: PhotoItem) => {
    if (!commentText.trim() || !currentUser) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      author: currentUser.realName,
      content: commentText,
      timestamp: '刚刚'
    };
    const updated = { ...photo, commentsList: [...(photo.commentsList || []), newComment] };
    StorageService.updatePhoto(updated);
    setPhotos(prev => prev.map(p => p.id === photo.id ? updated : p));
    setCommentText('');
  };

  const handleEdit = (photo: PhotoItem) => {
    setEditingId(photo.id);
    setUploadTitle(photo.title);
    setUploadTags(photo.tags.join(' ').replace(/#/g, ''));
    setUploadPreview(photo.url);
    setShowUploadModal(true);
  };

  const handleProcessSubmit = async () => {
    if ((!uploadPreview && !editingId) || !uploadTitle.trim() || !currentUser) return;
    setIsProcessing(true);
    
    // Simulate processing
    await new Promise(r => setTimeout(r, 600));
    
    const tagsArr = uploadTags.split(/[\s,，]+/).filter(t => t.trim()).map(t => t.startsWith('#') ? t : `#${t}`);

    if (editingId) {
      const existing = StorageService.getPhotos().find(p => p.id === editingId);
      if (existing) {
        const updated: PhotoItem = {
          ...existing,
          title: uploadTitle,
          tags: tagsArr.length > 0 ? tagsArr : ['#精选摄影'],
          url: uploadPreview || existing.url
        };
        StorageService.updatePhoto(updated);
        triggerToast('作品信息及图片已更新');
      }
    } else {
      const newPhoto: PhotoItem = {
        id: Date.now().toString(),
        creatorId: currentUser.id,
        title: uploadTitle,
        url: uploadPreview || '',
        author: currentUser.realName,
        likes: 0,
        tags: tagsArr.length > 0 ? tagsArr : ['#精选摄影'],
        commentsList: []
      };
      StorageService.savePhoto(newPhoto);
      triggerToast('新作品发布成功');
    }

    loadPhotos();
    setIsProcessing(false);
    resetModal();
  };

  const resetModal = () => {
    setShowUploadModal(false);
    setEditingId(null);
    setUploadFile(null);
    setUploadPreview(null);
    setUploadTitle('');
    setUploadTags('');
  };

  const filteredPhotos = photos.filter(photo => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    const termWithoutHash = term.replace('#', '');
    const matchesTitle = photo.title.toLowerCase().includes(term);
    const matchesTags = photo.tags.some(tag => {
      const tagLower = tag.toLowerCase();
      return tagLower.includes(term) || tagLower.replace('#', '').includes(termWithoutHash);
    });

    return matchesTitle || matchesTags;
  });

  return (
    <div className="space-y-12 pb-20 animate-fadeIn relative" onPaste={handlePaste}>
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-gray-950 text-white px-10 py-5 rounded-[2rem] shadow-2xl font-black flex items-center gap-4 animate-bounce border border-white/10">
          <CheckCircle size={24} className="text-green-400" />
          {showToast.msg}
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col gap-10 bg-white p-12 rounded-[3.5rem] shadow-sm border border-green-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-5xl font-black text-green-950 tracking-tight">图片中心</h1>
            <p className="text-gray-400 font-medium mt-2 italic">收录每一份值得珍藏的视觉瞬间</p>
          </div>
          <button onClick={() => setShowUploadModal(true)} className="px-14 py-6 gradient-redsea text-white font-black text-xl rounded-[2rem] shadow-xl hover:scale-105 transition-transform active:scale-95">
            发布新作品
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors" size={28} />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="按题目或话题搜索 (如: 夏日 或 #花絮)..." 
            className="w-full pl-20 pr-10 py-7 rounded-[2.5rem] bg-gray-50 border-none outline-none focus:ring-4 focus:ring-green-100 font-bold text-xl shadow-inner placeholder:text-gray-300" 
          />
        </div>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {filteredPhotos.map(photo => (
          <div key={photo.id} className="group bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-gray-50 flex flex-col">
            <div className="aspect-[3/4] overflow-hidden relative bg-gray-100">
              <img src={photo.url} alt={photo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-5">
                <button onClick={() => setPreviewPhoto(photo)} className="p-5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white hover:bg-white/40 transition-all shadow-xl"><Maximize2 size={28} /></button>
                {(photo.creatorId === currentUser?.id || isAdmin) && (
                  <button onClick={() => handleEdit(photo)} className="p-5 bg-blue-600/90 rounded-full text-white hover:bg-blue-600 transition-all shadow-xl"><Edit3 size={28} /></button>
                )}
              </div>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 line-clamp-1 cursor-pointer hover:text-green-700 transition-colors" onClick={() => setPreviewPhoto(photo)}>{photo.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {photo.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-xs font-black text-gray-400 italic">@{photo.author}</span>
                <div className="flex items-center gap-5">
                  <button onClick={() => handleLike(photo)} className={`flex items-center gap-2 transition-all active:scale-150 ${likedIds.has(photo.id) ? 'text-red-500' : 'text-gray-300 hover:text-red-500'}`}>
                    <Heart size={22} className={likedIds.has(photo.id) ? "fill-current" : ""} />
                    <span className="text-sm font-black">{photo.likes}</span>
                  </button>
                  <button onClick={() => setActiveCommentId(activeCommentId === photo.id ? null : photo.id)} className={`flex items-center gap-2 transition-colors ${activeCommentId === photo.id ? 'text-blue-500' : 'text-gray-300 hover:text-blue-500'}`}>
                    <MessageSquare size={22} />
                    <span className="text-sm font-black">{photo.commentsList?.length || 0}</span>
                  </button>
                </div>
              </div>

              {activeCommentId === photo.id && (
                <div className="pt-6 space-y-4 animate-fadeIn">
                  <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {photo.commentsList?.map(c => (
                      <div key={c.id} className="text-[11px] bg-gray-50 p-3 rounded-xl font-medium">
                        <span className="font-black text-green-800">{c.author}: </span>{c.content}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 bg-gray-100 rounded-2xl p-2 pr-4">
                    <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="写下你的想法..." className="flex-grow bg-transparent p-2 outline-none text-xs font-bold" onKeyDown={(e) => e.key === 'Enter' && handleAddComment(photo)} />
                    <button onClick={() => handleAddComment(photo)} className="text-green-600"><Send size={18} /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upload/Edit Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onPaste={handlePaste}>
          <div className="bg-white rounded-[4rem] w-full max-w-2xl p-14 relative shadow-2xl space-y-10 animate-scaleUp">
            <button onClick={resetModal} className="absolute top-10 right-10 text-gray-300 hover:text-red-500 transition-colors"><X size={40} /></button>
            <h2 className="text-4xl font-black text-gray-950 text-center">{editingId ? '编辑摄影灵感' : '发布全新摄影'}</h2>
            
            <div className="space-y-8">
              <div 
                className="border-4 border-dashed border-gray-100 rounded-[3rem] p-10 text-center bg-gray-50 hover:border-green-200 hover:bg-green-50/30 transition-all cursor-pointer relative group/upload overflow-hidden" 
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadPreview ? (
                  <div className="relative">
                    <img src={uploadPreview} className="max-h-64 mx-auto rounded-2xl shadow-lg group-hover/upload:opacity-40 transition-opacity" alt="Preview" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity">
                      <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-2xl font-black text-green-700 flex items-center gap-2 shadow-xl">
                        <ImageIcon size={20} /> 点击或直接粘贴更换图片
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 space-y-4">
                    <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center text-gray-200 shadow-sm group-hover/upload:text-green-400 transition-colors"><Upload size={40} /></div>
                    <p className="text-lg font-black text-gray-300 italic">点击此处选择文件，或直接 Ctrl+V 粘贴图片</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">作品题目</label>
                  <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="为这瞬间起个心动的名字..." className="w-full p-6 rounded-2xl bg-gray-50 border-none outline-none focus:ring-4 focus:ring-green-100 font-bold text-lg" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 flex items-center gap-1"><Hash size={12}/> 话题标签</label>
                  <input type="text" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="用空格分隔标签, 如: 夏日 花絮..." className="w-full p-6 rounded-2xl bg-gray-50 border-none outline-none focus:ring-4 focus:ring-green-100 font-bold text-lg" />
                </div>
              </div>

              <button 
                onClick={handleProcessSubmit} 
                disabled={isProcessing || !uploadPreview || !uploadTitle.trim()} 
                className="w-full py-7 gradient-redsea text-white font-black text-2xl rounded-[2.5rem] shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {isProcessing ? '正在处理中...' : (editingId ? '保存所有修改' : '确认并正式发布')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-fadeIn" onClick={() => setPreviewPhoto(null)}>
          <button className="absolute top-10 right-10 text-white/40 hover:text-white transition-colors"><X size={60} /></button>
          <div className="max-w-5xl w-full flex flex-col items-center gap-10" onClick={e => e.stopPropagation()}>
            <img src={previewPhoto.url} className="max-h-[85vh] w-auto rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10" alt={previewPhoto.title} />
            <div className="text-center space-y-5">
              <h2 className="text-5xl font-black text-white tracking-tight">{previewPhoto.title}</h2>
              <div className="flex justify-center gap-3">
                {previewPhoto.tags.map(t => <span key={t} className="px-6 py-2 bg-white/10 text-white/90 rounded-full text-sm font-black border border-white/10">{t}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

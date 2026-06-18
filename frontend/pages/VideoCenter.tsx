
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { VideoItem, Comment } from '../types';
import { Heart, MessageSquare, Play, Search, Trash2, Send, X, Upload, FileWarning, ShoppingBag } from 'lucide-react';
import { MOCK_MERCH } from '../constants';

export const VideoCenter: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Upload state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMerchId, setUploadMerchId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = StorageService.getCurrentUser();
  const isAdmin = StorageService.isAdmin(currentUser?.id);

  useEffect(() => {
    setVideos(StorageService.getVideos());
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/quicktime', 'audio/mpeg', 'video/x-matroska', 'video/webm', 'audio/mp3'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('格式不支持！视频区仅允许上传 mp4, mp3, mov 等影音文件。');
      setUploadFile(null);
      return;
    }

    setUploadError(null);
    setUploadFile(file);
  };

  const handleLikeToggle = (vid: VideoItem) => {
    const isLiked = likedIds.has(vid.id);
    const updatedLikes = isLiked ? (vid.likes - 1) : (vid.likes + 1);
    const updated = { ...vid, likes: Math.max(0, updatedLikes) };
    
    const newLikedIds = new Set(likedIds);
    if (isLiked) newLikedIds.delete(vid.id);
    else newLikedIds.add(vid.id);
    setLikedIds(newLikedIds);

    StorageService.updateVideo(updated);
    setVideos(StorageService.getVideos());
  };

  const handleAddComment = (vid: VideoItem) => {
    if (!commentText.trim() || !currentUser) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      author: currentUser.realName,
      content: commentText,
      timestamp: '刚刚'
    };
    const updated = { ...vid, commentsList: [...(vid.commentsList || []), newComment] };
    StorageService.updateVideo(updated);
    setVideos(StorageService.getVideos());
    setCommentText('');
  };

  const handleDelete = (id: string) => {
    const user = StorageService.getCurrentUser();
    if (!user) return;
    if (window.confirm('视频将移至回收站，确定吗？')) {
      StorageService.removeVideo(id, user.id);
      setVideos(StorageService.getVideos());
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadTitle.trim() || !uploadFile || !currentUser) {
      setUploadError('请填写标题并选择影音文件。');
      return;
    }
    setIsUploading(true);
    await new Promise(r => setTimeout(r, 1500));
    
    const newVid: VideoItem = {
      id: Date.now().toString(),
      creatorId: currentUser.id,
      title: uploadTitle,
      author: currentUser.realName,
      likes: 0,
      comments: 0,
      cover: 'https://picsum.photos/seed/' + Math.random() + '/400/600',
      tags: ['#用户投递'],
      commentsList: [],
      merchId: uploadMerchId || undefined
    };

    StorageService.saveVideo(newVid);
    setVideos(StorageService.getVideos());
    setIsUploading(false);
    setShowUploadModal(false);
    setUploadTitle('');
    setUploadFile(null);
    setUploadMerchId('');
  };

  const filteredVideos = videos.filter(vid => 
    vid.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vid.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-green-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-4xl font-black text-green-950">视频区</h1>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="px-10 py-4 gradient-redsea text-white font-black rounded-2xl shadow-lg hover:scale-105 transition-transform"
          >
            上传视频
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="搜索你想看的甜蜜瞬间..." 
            className="w-full pl-16 pr-8 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-4 focus:ring-green-50 font-medium shadow-inner" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredVideos.map(vid => (
          <div key={vid.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm group border border-gray-50 flex flex-col hover:shadow-2xl transition-all">
            <div className="relative aspect-video overflow-hidden bg-black">
              <img src={vid.cover} className="w-full h-full object-cover group-hover:scale-110 opacity-70 transition-transform duration-700" alt={vid.title} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                  <Play fill="white" size={32} className="text-white ml-1" />
                </div>
              </div>
              
              {/* 关联周边提示标签 */}
              {vid.merchId && (
                <div className="absolute bottom-4 right-4 z-20">
                   <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(vid.merchId ? `/merch/${vid.merchId}` : '/merch');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-900/80 backdrop-blur-md text-white rounded-xl text-xs font-black shadow-lg hover:bg-green-700 transition-colors"
                   >
                     <ShoppingBag size={14} /> 推广中
                   </button>
                </div>
              )}

              {(vid.creatorId === currentUser?.id || isAdmin) && (
                <button 
                  onClick={() => handleDelete(vid.id)}
                  className="absolute top-4 right-4 z-20 p-3 bg-red-600/90 text-white rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={24} />
                </button>
              )}
            </div>
            
            <div className="p-8 space-y-6 flex-grow">
              <h3 className="text-2xl font-black text-gray-900 line-clamp-1">{vid.title}</h3>
              
              {/* 如果有关联周边，显示快速跳转链接 */}
              {vid.merchId && (
                <div 
                  onClick={() => navigate(`/merch/${vid.merchId}`)}
                  className="bg-green-50 p-4 rounded-2xl flex items-center justify-between group/link cursor-pointer hover:bg-green-100 transition-colors border border-green-100/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm">
                      <ShoppingBag size={20} />
                    </div>
                    <span className="text-sm font-black text-green-900">查看同款饭制周边</span>
                  </div>
                  <X size={16} className="text-green-300 group-hover/link:translate-x-1 transition-transform rotate-[-135deg]" />
                </div>
              )}

              <div className="flex items-center gap-8 pt-2 text-gray-400">
                <button 
                  onClick={() => handleLikeToggle(vid)}
                  className={`flex items-center gap-2 hover:text-red-500 transition-all active:scale-125 ${likedIds.has(vid.id) ? 'text-red-500' : ''}`}
                >
                  <Heart size={24} className={likedIds.has(vid.id) ? "fill-current" : ""} />
                  <span className="font-bold text-lg">{vid.likes}</span>
                </button>
                <button 
                  onClick={() => setActiveCommentId(activeCommentId === vid.id ? null : vid.id)}
                  className={`flex items-center gap-2 transition-colors ${activeCommentId === vid.id ? 'text-blue-500' : 'hover:text-blue-500'}`}
                >
                  <MessageSquare size={24} />
                  <span className="font-bold text-lg">{vid.commentsList?.length || 0}</span>
                </button>
                <span className="ml-auto text-xs font-black bg-green-50 text-green-700 px-3 py-1 rounded-full italic">@{vid.author}</span>
              </div>

              {activeCommentId === vid.id && (
                <div className="pt-6 border-t border-gray-50 space-y-4 animate-fadeIn">
                  <div className="max-h-40 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {vid.commentsList?.map(c => (
                      <div key={c.id} className="text-xs bg-gray-50 p-3 rounded-2xl">
                        <span className="font-black text-green-800">{c.author}: </span>
                        {c.content}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 bg-gray-100 rounded-2xl p-2 pr-4">
                    <input 
                      type="text" 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="友善发言..."
                      className="flex-grow bg-transparent p-2 outline-none text-xs font-medium"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(vid)}
                    />
                    <button onClick={() => handleAddComment(vid)} className="text-green-600 hover:scale-110 transition-transform"><Send size={20} /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 relative shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <button onClick={() => setShowUploadModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500"><X size={32} /></button>
            <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">发布影音作品</h2>
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">视频标题</label>
                <input 
                  type="text" 
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="给作品起个好听的名字..."
                  className="w-full p-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-4 focus:ring-green-100 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">关联周边 (可选)</label>
                <select 
                  value={uploadMerchId}
                  onChange={(e) => setUploadMerchId(e.target.value)}
                  className="w-full p-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-4 focus:ring-green-100 font-medium appearance-none"
                >
                  <option value="">无关联周边</option>
                  {MOCK_MERCH.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-4 border-dashed rounded-[2.5rem] p-12 text-center cursor-pointer transition-all ${
                  uploadFile ? 'border-green-200 bg-green-50/20' : 'border-gray-100 bg-gray-50/50 hover:border-green-200'
                }`}
              >
                <div className="flex justify-center mb-4 text-gray-300">
                  {uploadFile ? <Play size={56} className="text-green-500" /> : <Upload size={56} />}
                </div>
                <p className="text-sm font-black text-gray-400">
                  {uploadFile ? uploadFile.name : '点击选择影音文件 (mp4, mp3...)'}
                </p>
                <input type="file" ref={fileInputRef} className="hidden" accept="video/*,audio/*" onChange={handleFileChange} />
              </div>
              
              {uploadError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border border-red-100">
                  <FileWarning size={18} /> {uploadError}
                </div>
              )}
              <button 
                onClick={handleUploadSubmit}
                disabled={isUploading || !uploadFile || !uploadTitle.trim()}
                className="w-full py-6 gradient-redsea text-white font-black text-xl rounded-[1.5rem] shadow-xl disabled:opacity-50 hover:scale-[1.02] transition-all"
              >
                {isUploading ? '正在极速上传...' : '确认并发布'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Post, Comment } from '../types';
import { Heart, MessageSquare, PlusCircle, User, Trash2, Send } from 'lucide-react';

export const Discussion: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  
  const currentUser = StorageService.getCurrentUser();
  const isAdmin = StorageService.isAdmin(currentUser?.id);

  useEffect(() => {
    setPosts(StorageService.getPosts());
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newPostContent.trim()) return;
    if (!currentUser) return;
    
    const post: Post = {
      id: Date.now().toString(),
      creatorId: currentUser.id,
      author: currentUser.realName,
      content: newPostContent,
      timestamp: '刚刚',
      likes: 0,
      tags: [],
      commentsList: [],
      attachments: [] // 清空附件支持
    };
    
    StorageService.savePost(post);
    setPosts(StorageService.getPosts());
    setNewPostContent('');
  };

  const handleLike = (post: Post) => {
    const isLiked = likedIds.has(post.id);
    const updatedLikes = isLiked ? (post.likes - 1) : (post.likes + 1);
    const updated = { ...post, likes: Math.max(0, updatedLikes) };
    
    const newLikedIds = new Set(likedIds);
    if (isLiked) newLikedIds.delete(post.id);
    else newLikedIds.add(post.id);
    setLikedIds(newLikedIds);

    StorageService.updatePost(updated);
    setPosts(StorageService.getPosts());
  };

  const handleAddComment = (post: Post) => {
    if (!commentText.trim() || !currentUser) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      author: currentUser.realName,
      content: commentText,
      timestamp: '刚刚'
    };
    const updated = { ...post, commentsList: [...(post.commentsList || []), newComment] };
    StorageService.updatePost(updated);
    setPosts(StorageService.getPosts());
    setCommentText('');
  };

  const handleDelete = (id: string) => {
    const user = StorageService.getCurrentUser();
    if (!user) return;
    if (window.confirm('内容将移至回收站并从当前页面移除，确定吗？')) {
      StorageService.removePost(id, user.id);
      setPosts(StorageService.getPosts());
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-sm p-10 border border-green-50/50">
        <h1 className="text-4xl font-black text-green-950 mb-8">交流广场</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="分享生活中的甜蜜瞬间..."
            className="w-full h-40 p-6 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-green-100 outline-none resize-none text-lg font-medium placeholder:text-gray-300 transition-all"
          />
          
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!newPostContent.trim()}
              className="px-12 py-4 gradient-redsea text-white font-black rounded-2xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <PlusCircle size={24} /> 发布动态
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-8">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 hover:border-green-100 transition-all shadow-sm group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl gradient-ningyuzhi flex items-center justify-center text-green-900 shadow-lg">
                  <User size={24} />
                </div>
                <div>
                  <div className="font-black text-gray-900 text-lg">{post.author}</div>
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">{post.timestamp}</div>
                </div>
              </div>
              
              {(post.creatorId === currentUser?.id || isAdmin) && (
                <button 
                  onClick={() => handleDelete(post.id)}
                  className="p-3 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={24} />
                </button>
              )}
            </div>
            
            <div className="space-y-6 mb-8">
              <p className="text-gray-700 text-xl leading-relaxed whitespace-pre-wrap font-medium">{post.content}</p>
            </div>
            
            <div className="flex items-center space-x-12 text-gray-400 pt-8 border-t border-gray-50">
              <button 
                onClick={() => handleLike(post)}
                className="flex items-center space-x-2 hover:text-red-500 transition-all active:scale-125"
              >
                <Heart size={24} className={likedIds.has(post.id) ? "fill-red-500 text-red-500" : ""} />
                <span className="font-black text-lg">{post.likes || 0}</span>
              </button>
              <button 
                onClick={() => setActiveCommentId(activeCommentId === post.id ? null : post.id)}
                className={`flex items-center space-x-2 transition-colors ${activeCommentId === post.id ? 'text-green-600' : 'hover:text-blue-500'}`}
              >
                <MessageSquare size={24} />
                <span className="font-black text-lg">评论 ({post.commentsList?.length || 0})</span>
              </button>
            </div>

            {activeCommentId === post.id && (
              <div className="mt-8 pt-8 border-t border-gray-50 space-y-6 animate-fadeIn">
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {post.commentsList?.map(c => (
                    <div key={c.id} className="bg-gray-50 p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-black text-green-900">{c.author}</span>
                        <span className="text-[10px] text-gray-400 font-bold">{c.timestamp}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{c.content}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-3 bg-gray-100 rounded-3xl p-3 pr-6">
                  <input 
                    type="text" 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="说点什么吧..."
                    className="flex-grow bg-transparent p-2 outline-none text-sm font-medium"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post)}
                  />
                  <button 
                    onClick={() => handleAddComment(post)}
                    className="p-2 text-green-600 hover:scale-110 transition-transform"
                  >
                    <Send size={24} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

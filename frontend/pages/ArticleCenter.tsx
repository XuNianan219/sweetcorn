import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Search, Sparkles, Trash2, Heart, MessageSquare, Send, X, Hash, PenTool, LayoutGrid, Plus, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { fetchPosts, createPost, deletePost } from '../services/postsApi';

export const ArticleCenter: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('全部');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newContent, setNewContent] = useState('');
  const [inspiration, setInspiration] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('创作投稿');
  const [customCategory, setCustomCategory] = useState('');
  const [categories, setCategories] = useState(['同人创作', '创作投稿', '日常随笔']);
  const [isGenerating, setIsGenerating] = useState(false);

  // 从 token 解出 userId
  useEffect(() => {
    const token = localStorage.getItem('sweetcorn_jwt_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch {
        setCurrentUserId(null);
      }
    }
  }, []);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPosts('fanfic');
      setArticles(data);
    } catch {
      setError('加载失败，请检查后端连接');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleDelete = async (id: string, authorId: string) => {
    if (currentUserId !== authorId) return;
    if (!window.confirm('文章将被删除，确认吗？')) return;
    try {
      await deletePost(id);
      await loadArticles();
    } catch {
      setError('删除失败，请重试');
    }
  };

  const handleLike = (artId: string) => {
    // 点赞暂时纯前端，后续接后端
    setArticles(prev => prev.map(a => a.id === artId ? { ...a, _liked: !a._liked } : a));
  };

  const generateAIFic = async () => {
    if (!inspiration.trim()) {
      alert('请先在灵感区输入片段，AI将为您扩写。');
      return;
    }
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `作为一个优秀的作家，请基于以下灵感进行优美的文学扩写：'${inspiration}'。约450字左右，风格清新温和。`,
      });
      setNewContent(response.text || '');
      if (!newTitle) setNewTitle('AI 创作灵感稿');
    } catch (err) {
      console.error(err);
      alert('扩写失败，请检查网络连接');
    } finally {
      setIsGenerating(false);
    }
  };

  const publishArticle = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      alert('标题和内容是正式发布的前提。');
      return;
    }
    const finalCategory = selectedCategory === '自定义' ? customCategory : selectedCategory;
    const hashtags = newTopic.split(/[\s,，]+/).filter(t => t.trim()).map(t => t.replace(/^#/, ''));

    setSubmitting(true);
    try {
      await createPost({
        content: newContent,
        category: 'fanfic',
        hashtags,
        title: newTitle, 
      });
      // 把 title 单独更新——createPost 里加 title 支持
      await loadArticles();
      setShowForm(false);
      setNewTitle(''); setNewTopic(''); setNewContent(''); setInspiration('');
      if (selectedCategory === '自定义' && customCategory && !categories.includes(customCategory)) {
        setCategories([...categories, customCategory]);
      }
    } catch {
      setError('发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredArticles = articles.filter(art => {
    const matchesSearch =
      art.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.author?.nickname?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === '全部';
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-12 pb-20 animate-fadeIn">
      <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-green-50 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-green-950 mb-4">文学馆</h1>
          <div className="flex flex-wrap gap-4 mt-2">
            {['全部'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`text-xs font-black px-6 py-2.5 rounded-full whitespace-nowrap transition-all ${activeTab === cat ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-12 py-5 gradient-redsea text-white font-black rounded-3xl shadow-xl hover:scale-105 transition-all flex items-center gap-2"
        >
          <PenTool size={24} /> 开启创作
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-500 rounded-2xl text-sm font-medium">{error}</div>
      )}

      <div className="relative">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300" size={28} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索文学作品..."
          className="w-full pl-20 pr-10 py-6 rounded-[2.5rem] bg-white border border-gray-100 outline-none focus:ring-4 focus:ring-green-50 font-medium text-xl shadow-sm"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-12 text-gray-400">
          <Loader2 size={32} className="animate-spin" />
        </div>
      )}

      {!loading && filteredArticles.length === 0 && (
        <div className="text-center py-12 text-gray-300 font-medium">还没有文章，来发第一篇吧！</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredArticles.map(art => (
          <div key={art.id} className="bg-white p-12 rounded-[3.5rem] border border-gray-100 hover:shadow-2xl transition-all group relative flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <span className="text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest bg-purple-50 text-purple-600">
                同人创作
              </span>
              {currentUserId === art.authorId && (
                <button onClick={() => handleDelete(art.id, art.authorId)} className="text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={24} />
                </button>
              )}
            </div>

            <h3 className="text-3xl font-black text-gray-950 mb-6 leading-tight group-hover:text-green-700 transition-colors">
              {art.title || '无题'}
            </h3>
            <p className="text-gray-500 leading-relaxed mb-10 font-medium line-clamp-5 whitespace-pre-wrap">{art.content}</p>

            {art.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-10">
                {art.hashtags.map((t: string) => (
                  <span key={t} className="text-xs text-green-700 font-black bg-green-50/50 px-4 py-2 rounded-xl flex items-center gap-2 border border-green-100">
                    <Hash size={14} /> {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto pt-10 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <button onClick={() => handleLike(art.id)} className="flex items-center gap-2 hover:text-red-500 transition-colors text-gray-400">
                  <Heart size={24} className={art._liked ? "fill-red-500 text-red-500" : ""} />
                  <span className="font-black text-lg">{art._liked ? 1 : 0}</span>
                </button>
                <button onClick={() => setActiveCommentId(activeCommentId === art.id ? null : art.id)} className="flex items-center gap-2 hover:text-blue-500 transition-colors text-gray-400">
                  <MessageSquare size={24} />
                  <span className="font-black text-lg">评论</span>
                </button>
              </div>
              <span className="text-sm font-black text-gray-400 italic">
                BY @{art.author?.nickname ?? '用户'}
              </span>
            </div>

            {activeCommentId === art.id && (
              <div className="mt-8 pt-8 border-t border-gray-50 space-y-4 animate-fadeIn">
                <p className="text-sm text-gray-400">评论功能即将接入后端～</p>
                <div className="flex gap-2 bg-gray-100 rounded-2xl p-2 pr-4">
                  <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="写下你的读后感..." className="flex-grow bg-transparent p-3 outline-none text-sm font-medium" />
                  <button className="text-green-600"><Send size={20} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 创作弹窗 */}
      {showForm && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-6xl p-12 relative shadow-2xl overflow-y-auto max-h-[95vh] space-y-10">
            <button onClick={() => setShowForm(false)} className="absolute top-10 right-10 text-gray-400 hover:text-red-500"><X size={40} /></button>
            <h2 className="text-4xl font-black text-gray-950 text-center">文学创作工坊</h2>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-14">
              <div className="lg:col-span-2 space-y-10 border-r border-gray-100 pr-14">
                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">创作类目</label>
                  <div className="flex flex-wrap gap-3">
                    {categories.map(c => (
                      <button key={c} onClick={() => setSelectedCategory(c)}
                        className={`px-5 py-3 rounded-2xl text-xs font-black border transition-all ${selectedCategory === c ? 'bg-green-600 text-white border-green-600 shadow-lg' : 'bg-white text-gray-400 border-gray-200 hover:border-green-200'}`}>
                        {c}
                      </button>
                    ))}
                    <button onClick={() => setSelectedCategory('自定义')}
                      className={`px-5 py-3 rounded-2xl text-xs font-black border transition-all ${selectedCategory === '自定义' ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-white text-gray-400 border-gray-200 hover:border-purple-200'}`}>
                      + 新增类目
                    </button>
                  </div>
                  {selectedCategory === '自定义' && (
                    <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="输入新类目名称..." className="w-full p-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-4 focus:ring-purple-100 font-medium" />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">文章题目</label>
                  <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="请输入心动的标题..." className="w-full p-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-4 focus:ring-green-100 font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2"><Hash size={14} /> 话题标签</label>
                  <input type="text" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="用空格或逗号分隔话题..." className="w-full p-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-4 focus:ring-green-100 font-medium" />
                </div>
                <div className="p-8 bg-green-50 rounded-[2.5rem] border border-green-100 space-y-6 shadow-inner">
                  <h3 className="font-black text-green-900 flex items-center gap-3 text-sm"><Sparkles size={20} /> 创作灵感扩写区</h3>
                  <textarea value={inspiration} onChange={(e) => setInspiration(e.target.value)} placeholder="提交灵感片段，AI将为您扩写..." className="w-full h-40 p-5 rounded-2xl bg-white border-none outline-none focus:ring-4 focus:ring-green-300 font-medium text-sm resize-none shadow-sm" />
                  <button onClick={generateAIFic} disabled={isGenerating || !inspiration.trim()} className="w-full py-4 gradient-ningyuzhi text-green-950 font-black rounded-2xl text-sm disabled:opacity-50 hover:shadow-xl transition-all flex items-center justify-center gap-3">
                    {isGenerating ? <LayoutGrid className="animate-spin" size={20} /> : <Plus size={20} />} 提交灵感并扩写
                  </button>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">正文编辑</label>
                  <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="扩写或创作的内容将在此显示，您可以随时润色修改..." className="w-full h-[550px] p-10 rounded-[3rem] bg-gray-50 border-none outline-none focus:ring-4 focus:ring-green-400 font-medium leading-relaxed resize-none shadow-inner text-xl" />
                </div>
                <button onClick={publishArticle} disabled={submitting} className="w-full py-6 gradient-redsea text-white font-black text-2xl rounded-3xl shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                  {submitting ? <Loader2 className="animate-spin" size={28} /> : '确认正式提交发布'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
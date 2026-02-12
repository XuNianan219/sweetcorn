
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { TrashItem } from '../types';
import { Trash2, RotateCcw, ShieldAlert, FileText, Image, Video, MessageSquare, ArrowLeft, CheckCircle, FolderOpen, Edit3, X, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminRecycleBin: React.FC = () => {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'post' | 'video' | 'photo' | 'article'>('all');
  
  // 编辑状态
  const [editingItem, setEditingItem] = useState<TrashItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const currentUser = StorageService.getCurrentUser();
  const isAdmin = StorageService.isAdmin(currentUser?.id);

  useEffect(() => {
    setTrashItems(StorageService.getTrash());
  }, []);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleRestoreSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`确定要退回选中的 ${selectedIds.size} 项内容到原始板块吗？`)) {
      selectedIds.forEach(id => StorageService.restoreFromTrash(id));
      setSelectedIds(new Set());
      setTrashItems(StorageService.getTrash());
    }
  };

  const handlePermanentDelete = (trashId: string) => {
    if (window.confirm('此操作将永久抹除数据，不可恢复！确认吗？')) {
      StorageService.permanentlyDeleteTrash(trashId);
      setTrashItems(StorageService.getTrash());
    }
  };

  const startEdit = (item: TrashItem) => {
    setEditingItem(item);
    setEditTitle(item.item.title || '');
    setEditContent(item.item.content || item.item.excerpt || '');
  };

  const saveAndRestore = () => {
    if (!editingItem) return;
    
    // 构造更新后的内部 item
    const updatedItem = {
      ...editingItem.item,
      title: editTitle,
      content: editContent,
      excerpt: editingItem.type === 'article' ? editContent : undefined
    };

    // 先更新回收站数据，再执行恢复
    StorageService.updateTrashItem(editingItem.trashId, updatedItem);
    StorageService.restoreFromTrash(editingItem.trashId);
    
    setEditingItem(null);
    setTrashItems(StorageService.getTrash());
    alert('修改成功并已退回到原始板块');
  };

  const getTypeIcon = (type: TrashItem['type']) => {
    switch (type) {
      case 'post': return <MessageSquare size={18} className="text-blue-500" />;
      case 'video': return <Video size={18} className="text-purple-500" />;
      case 'photo': return <Image size={18} className="text-green-500" />;
      case 'article': return <FileText size={18} className="text-orange-500" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'post': return '讨论区';
      case 'video': return '视频区';
      case 'photo': return '图片区';
      case 'article': return '文章区';
      default: return '全部';
    }
  };

  const filteredItems = activeTab === 'all' 
    ? trashItems 
    : trashItems.filter(item => item.type === activeTab);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fadeIn pb-20">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-green-600 font-black transition-colors">
          <ArrowLeft size={20} /> 返回乐园
        </Link>
        <h1 className="text-4xl font-black text-gray-900 flex items-center gap-4">
          <Trash2 size={40} className="text-red-500" /> 回收站管理
        </h1>
        <div className="w-20" />
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl">
            {(['all', 'post', 'video', 'photo', 'article'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedIds(new Set()); }}
                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === tab ? 'bg-white text-green-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {getTypeName(tab)}
              </button>
            ))}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex gap-4 animate-fadeIn">
              <button 
                onClick={handleRestoreSelected}
                className="px-8 py-3 bg-green-600 text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2"
              >
                <RotateCcw size={18} /> 批量退回 ({selectedIds.size})
              </button>
              <button 
                onClick={() => {
                  if (window.confirm(`确定永久清除这 ${selectedIds.size} 项数据吗？`)) {
                    selectedIds.forEach(id => StorageService.permanentlyDeleteTrash(id));
                    setSelectedIds(new Set());
                    setTrashItems(StorageService.getTrash());
                  }
                }}
                className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2"
              >
                <Trash2 size={18} /> 永久抹除
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {filteredItems.length > 0 ? filteredItems.map(item => (
            <div 
              key={item.trashId} 
              onClick={() => toggleSelect(item.trashId)}
              className={`group flex items-center gap-6 p-6 rounded-[2rem] border transition-all cursor-pointer ${
                selectedIds.has(item.trashId) ? 'bg-green-50 border-green-200 shadow-inner' : 'bg-white border-gray-50 hover:border-red-100 hover:shadow-md'
              }`}
            >
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedIds.has(item.trashId) ? 'bg-green-600 border-green-600 text-white' : 'border-gray-200 bg-white'
              }`}>
                {selectedIds.has(item.trashId) && <CheckCircle size={18} />}
              </div>

              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                {item.type === 'photo' ? <img src={item.item.url} className="w-full h-full object-cover opacity-50" /> : getTypeIcon(item.type)}
              </div>

              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    item.type === 'post' ? 'bg-blue-50 text-blue-600' :
                    item.type === 'video' ? 'bg-purple-50 text-purple-600' :
                    item.type === 'photo' ? 'bg-green-50 text-green-600' :
                    'bg-orange-50 text-orange-600'
                  }`}>
                    {getTypeName(item.type)}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">删除于: {item.deletedAt}</span>
                </div>
                <h3 className="font-black text-gray-800 text-lg line-clamp-1">
                  {item.item.title || item.item.content?.substring(0, 60) || '无标题内容'}
                </h3>
                <p className="text-xs text-gray-400 font-bold italic mt-1">原作者: @{item.item.author}</p>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => startEdit(item)}
                  className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                  title="修改内容"
                >
                  <Edit3 size={20} />
                </button>
                <button 
                  onClick={() => {
                    StorageService.restoreFromTrash(item.trashId);
                    setTrashItems(StorageService.getTrash());
                  }}
                  className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"
                  title="退回原位置"
                >
                  <RotateCcw size={20} />
                </button>
                <button 
                  onClick={() => handlePermanentDelete(item.trashId)}
                  className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                  title="永久抹除"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          )) : (
            <div className="py-32 text-center border-4 border-dashed border-gray-50 rounded-[3.5rem] bg-gray-50/20">
              <FolderOpen size={64} className="mx-auto text-gray-200 mb-6" />
              <p className="text-gray-400 font-black text-xl italic">
                回收站很干净，没有待退回的内容。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 回收站内编辑弹窗 */}
      {editingItem && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 relative shadow-2xl">
            <button onClick={() => setEditingItem(null)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500"><X size={32} /></button>
            <h2 className="text-2xl font-black text-gray-900 mb-8">修改已删除内容</h2>
            
            <div className="space-y-6">
              {editingItem.item.title !== undefined && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">标题</label>
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-4 rounded-xl bg-gray-50 border-none outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">正文 / 描述内容</label>
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-48 p-4 rounded-xl bg-gray-50 border-none outline-none focus:ring-4 focus:ring-blue-100 font-medium resize-none"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl flex items-center gap-3 text-blue-600 text-xs font-bold border border-blue-100">
                <ShieldAlert size={18} /> 注意：点击下方按钮将同时“保存修改”并“退回原板块”。
              </div>

              <button 
                onClick={saveAndRestore}
                className="w-full py-5 gradient-ningyuzhi text-green-950 font-black text-xl rounded-2xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <Save size={24} /> 修改并原位退回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

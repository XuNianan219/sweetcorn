
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_VIDEOS, MOCK_ARTICLES } from '../constants';
import { Play, BookOpen, Hash, ArrowLeft } from 'lucide-react';

export const TagResults: React.FC = () => {
  const { tagName } = useParams<{ tagName: string }>();
  const [activeTab, setActiveTab] = useState<'video' | 'article'>('video');

  const filteredVideos = MOCK_VIDEOS.filter(v => v.tags.includes(tagName || ''));
  const filteredArticles = MOCK_ARTICLES.filter(a => a.tags.includes(tagName || ''));

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Link to={-1 as any} className="flex items-center gap-2 text-gray-500 hover:text-green-600 font-bold transition-colors">
          <ArrowLeft size={20} /> 返回
        </Link>
        <div className="flex items-center gap-2 px-6 py-2 gradient-ningyuzhi rounded-full text-green-900 font-black shadow-sm">
          <Hash size={20} />
          <span className="text-xl">{tagName}</span>
        </div>
        <div className="w-20" /> {/* Spacer */}
      </div>

      <div className="flex justify-center border-b border-green-100">
        <button
          onClick={() => setActiveTab('video')}
          className={`px-8 py-4 font-black text-lg transition-all ${activeTab === 'video' ? 'text-green-600 border-b-4 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          相关视频 ({filteredVideos.length})
        </button>
        <button
          onClick={() => setActiveTab('article')}
          className={`px-8 py-4 font-black text-lg transition-all ${activeTab === 'article' ? 'text-green-600 border-b-4 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          相关文章 ({filteredArticles.length})
        </button>
      </div>

      {activeTab === 'video' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredVideos.length > 0 ? filteredVideos.map(vid => (
            <div key={vid.id} className="relative aspect-[3/4.5] bg-gray-200 rounded-3xl overflow-hidden group shadow-md hover:shadow-xl transition-all">
              <img src={vid.cover} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play fill="white" size={40} className="text-white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-bold truncate">{vid.title}</h3>
                <p className="text-xs opacity-70">@{vid.author}</p>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center text-gray-400 italic">暂无相关视频</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredArticles.length > 0 ? filteredArticles.map(art => (
            <div key={art.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 text-xs text-green-600 mb-4 font-black">
                <BookOpen size={14} /> 文章内容
              </div>
              <h3 className="text-2xl font-black mb-4">{art.title}</h3>
              <p className="text-gray-500 mb-6 line-clamp-3">{art.excerpt}</p>
              <div className="flex items-center justify-between text-sm text-gray-400 font-bold">
                <span>@{art.author}</span>
                <span>{art.date}</span>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center text-gray-400 italic">暂无相关文章</div>
          )}
        </div>
      )}
    </div>
  );
};

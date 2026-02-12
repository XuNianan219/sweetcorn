
import React, { useState } from 'react';
import { MOCK_POSTS } from '../constants';
import { Heart, MessageSquare, Share2 } from 'lucide-react';

export const Home: React.FC = () => {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [newPost, setNewPost] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    // Added tags property to satisfy the inferred Post type (which includes tags from MOCK_POSTS)
    const post = {
      id: Date.now().toString(),
      author: '路过的玉米',
      content: newPost,
      timestamp: '刚刚',
      likes: 0,
      tags: []
    };
    setPosts([post, ...posts]);
    setNewPost('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-50/50">
        <h1 className="text-2xl font-bold text-green-900 mb-4">讨论区 · 每日碎碎念</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="分享你对这对CP的感想..."
            className="w-full h-32 p-4 rounded-xl border border-green-100 focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 gradient-ningyuzhi text-green-900 font-bold rounded-full hover:shadow-md transition-shadow"
            >
              发布动态
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-200 transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full gradient-ningyuzhi" />
              <div>
                <div className="font-bold text-gray-900">{post.author}</div>
                <div className="text-xs text-gray-400">{post.timestamp}</div>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">{post.content}</p>
            <div className="flex items-center space-x-6 text-gray-400 text-sm">
              <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                <Heart size={18} />
                <span>{post.likes}</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                <MessageSquare size={18} />
                <span>评论</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-green-500 transition-colors ml-auto">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

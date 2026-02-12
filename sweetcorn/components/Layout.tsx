
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, MessageCircle, PlayCircle, BookOpen, ShoppingBag, Calendar, User, Heart, MapPin, Mic, Image as ImageIcon, LogOut, Trash2, Package } from 'lucide-react';
import { StorageService } from '../services/storage';

const navItems = [
  { path: '/', label: '首页', icon: HomeIcon },
  { path: '/timeline', label: '恋爱史', icon: Heart },
  { path: '/celeb-a', label: '梓渝', icon: User },
  { path: '/celeb-b', label: '田栩宁', icon: User },
  { path: '/discussion', label: '讨论区', icon: MessageCircle },
  { path: '/video', label: '视频区', icon: PlayCircle },
  { path: '/photo', label: '图片区', icon: ImageIcon },
  { path: '/article', label: '文章区', icon: BookOpen },
  { path: '/commercial', label: '商务区', icon: ShoppingBag },
  { path: '/merch', label: '饭制周边', icon: Package },
  { path: '/activity', label: '活动区', icon: Calendar },
  { path: '/tourism', label: '旅游推荐', icon: MapPin },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/';

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    window.location.reload();
  };

  const currentUser = StorageService.getCurrentUser();
  const isAdmin = StorageService.isAdmin(currentUser?.id);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf9e8]">
      <header className={`sticky top-0 z-50 transition-all duration-300 ${isLanding ? 'bg-white/40 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-md border-b border-[#E2F7C1]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 rounded-full gradient-ningyuzhi shadow-sm" />
            </div>
            
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 overflow-x-auto pb-1 custom-scrollbar">
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-1 px-2 py-1 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-500'
                    }`
                  }
                >
                  <item.icon size={14} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              
              {isAdmin && (
                <NavLink
                  to="/admin-recycle"
                  className={({ isActive }) =>
                    `flex items-center space-x-1 px-2 py-1 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400 hover:text-red-500'
                    }`
                  }
                >
                  <Trash2 size={14} />
                  <span>回收站</span>
                </NavLink>
              )}

              <div className="h-6 w-px bg-gray-200 mx-2" />
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full text-green-700 text-xs font-bold whitespace-nowrap">
                <User size={12} /> {currentUser?.realName}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className={`flex-grow ${isLanding ? '' : 'max-w-7xl mx-auto w-full px-4 py-8'}`}>
        {children}
      </main>

      <footer className="bg-white py-8 border-t border-[#E2F7C1]">
        <div className="text-center text-gray-400 text-sm font-medium">
          © 2026 甜玉米 CP 应援站 | 蓬勃生长
        </div>
      </footer>

      <button
        onClick={() => setIsLiveOpen(!isLiveOpen)}
        className="fixed bottom-8 right-8 w-14 h-14 gradient-ningyuzhi rounded-full shadow-lg flex items-center justify-center text-green-900 hover:scale-110 transition-transform z-50"
      >
        <Mic size={24} />
      </button>

      {isLiveOpen && <LiveAssistant onClose={() => setIsLiveOpen(false)} />}
    </div>
  );
};

const LiveAssistant: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed bottom-24 right-8 w-80 bg-white rounded-2xl shadow-2xl border border-green-100 p-4 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-green-800">玉米小助手</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500">×</button>
      </div>
      <div className="h-48 bg-gray-50 rounded-lg mb-4 flex items-center justify-center p-4 text-center text-sm text-gray-500">
        已就绪，正在聆听您的心声...
      </div>
      <button className="w-full py-2 gradient-ningyuzhi text-green-900 font-bold rounded-full shadow-sm">
        开始通话
      </button>
    </div>
  );
};

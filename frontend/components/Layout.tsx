import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clapperboard,
  Heart,
  Home as HomeIcon,
  MapPin,
  MessageCircle,
  Mic,
  Package,
  ShoppingBag,
  Trash2,
  User,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { clearToken } from '../services/postsApi';

function getPhoneFromToken(): string | null {
  const token = localStorage.getItem('sweetcorn_jwt_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.phone ?? null;
  } catch {
    return null;
  }
}

const navItems = [
  { path: '/', label: '首页', icon: HomeIcon },
  { path: '/timeline', label: '恋爱史', icon: Heart },
  { path: '/celeb-a', label: '梓渝', icon: User },
  { path: '/celeb-b', label: '田栩宁', icon: User },
  { path: '/discussion', label: '讨论区', icon: MessageCircle },
  { path: '/media', label: '影像区', icon: Clapperboard },
  { path: '/article', label: '文章区', icon: BookOpen },
  { path: '/commercial', label: '商务区', icon: ShoppingBag },
  { path: '/category/merchandise', label: '周边', icon: Package },
  { path: '/activity', label: '活动区', icon: Calendar },
  { path: '/travel', label: '旅游推荐', icon: MapPin },
  { path: '/account', label: '账号管理', icon: User },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userVersion, setUserVersion] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/landing';

  const currentUser = StorageService.getCurrentUser();
  const isAdmin = StorageService.isAdmin(currentUser?.id);
  const users = StorageService.getUsers();
  const phone = getPhoneFromToken();

  const handleLogout = () => {
    clearToken();
    StorageService.setCurrentUser(null);
    navigate('/login');
  };

  const handleUserSwitch = (userId: string) => {
    if (!isAdmin) return;
    const user = users.find((item) => item.id === userId);
    if (!user) return;
    StorageService.setCurrentUser(user);
    setUserVersion((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf9e8]">
      <header className={`relative sticky top-0 z-50 transition-all duration-300 ${isLanding ? 'bg-white/40 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-md border-b border-[#E2F7C1]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 rounded-full gradient-ningyuzhi shadow-sm" />
            </div>
            <button
            className="md:hidden p-2"
           onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
           ☰
            </button>
            <nav
            key={userVersion}
            className={`
           ${isMobileMenuOpen ? 'flex flex-col absolute top-16 left-0 w-full bg-white shadow-md p-4 space-y-2' : 'hidden'}
           md:flex md:static md:flex-row md:items-center md:space-x-1 lg:space-x-2 md:shadow-none md:p-0
         `}
            >
              {navItems.map((item) => (
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
                <User size={12} />
                <span>{phone ?? currentUser?.realName}</span>
              </div>

              {isAdmin && (
                <select
                  value={currentUser?.id}
                  onChange={(e) => handleUserSwitch(e.target.value)}
                  className="text-xs font-bold bg-white border border-green-100 rounded-full px-3 py-1.5 text-green-700 outline-none"
                  title="管理员切换用户视角"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.realName}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={handleLogout}
                className="text-xs font-bold px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200"
              >
                退出
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className={`flex-grow ${isLanding ? '' : 'max-w-7xl mx-auto w-full px-4 py-8'}`}>{children}</main>

      <footer className="bg-white py-8 border-t border-[#E2F7C1]">
        <div className="text-center text-gray-400 text-sm font-medium">© 2026 甜玉米 CP 应援站</div>
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
        <button onClick={onClose} className="text-gray-400 hover:text-red-500">
          ×
        </button>
      </div>
      <div className="h-48 bg-gray-50 rounded-lg mb-4 flex items-center justify-center p-4 text-center text-sm text-gray-500">已就绪，正在聆听你的想法。</div>
      <button className="w-full py-2 gradient-ningyuzhi text-green-900 font-bold rounded-full shadow-sm">开始通话</button>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clapperboard,
  Heart,
  MapPin,
  MessageCircle,
  Package,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useCurrentUser } from '../contexts/UserContext';
import { useLang } from '../contexts/LanguageContext';
import { NotificationBell } from './NotificationBell';

const navItems = [
  { path: '/timeline', label: '甜玉米日记', en: 'Diary', icon: Heart },
  { path: '/celeb-a', label: '梓渝', en: 'Ziyu', icon: User },
  { path: '/celeb-b', label: '田栩宁', en: 'Tianxuning', icon: User },
  { path: '/discussion', label: '嗑学研究所', en: 'Discussion', icon: MessageCircle },
  { path: '/media', label: '嗑学影像', en: 'Media', icon: Clapperboard },
  { path: '/article', label: '嗑学论文', en: 'Articles', icon: BookOpen },
  { path: '/category/merchandise', label: '甜玉米市集', en: 'Market', icon: Package },
  { path: '/category/events-business', label: '嗑学情报站', en: 'Events', icon: Calendar },
  { path: '/travel', label: '嗑学旅行', en: 'Travel', icon: MapPin },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/landing';

  // 后端账号体系：控制顶部账号区（登录 / 头像 / 管理员盾牌）
  const { user: authUser, isLoggedIn, isAdmin: authIsAdmin } = useCurrentUser();
  const { lang, t } = useLang();

  const avatarIsUrl = !!authUser?.avatarUrl && /^https?:\/\//.test(authUser.avatarUrl);
  // 盾牌底色：超级管理员紫色，普通管理员金色
  const badgeColor = authUser?.role === 'super_admin' ? 'bg-purple-500' : 'bg-yellow-500';

  // 移动端抽屉打开时锁定 body 滚动
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf9e8]">
      <header
        className={`relative sticky top-0 z-50 transition-all duration-300 ${isLanding ? 'bg-white/40 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-md border-b border-[#E2F7C1]'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/');
              }}
            >
              <div className="w-9 h-9 rounded-full gradient-ningyuzhi shadow-sm flex items-center justify-center text-lg leading-none">
                🌽
              </div>
              <span className="text-base font-black text-green-700 hidden sm:inline">{lang === 'en' ? 'SweetCorn' : '甜玉米'}</span>
            </div>
            <button
            className="md:hidden p-2"
           onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
           ☰
            </button>
            <nav
            onClick={(e) => e.stopPropagation()}
            className={`
           ${isMobileMenuOpen ? 'flex flex-col absolute top-16 left-0 w-full bg-white shadow-md p-4 space-y-2 z-50 transition-transform duration-300' : 'hidden'}
           md:flex md:static md:flex-row md:items-center md:space-x-1 lg:space-x-2 md:shadow-none md:p-0 md:z-auto
         `}
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-1 px-2 py-1 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-500'
                    }`
                  }
                >
                  <item.icon size={14} />
                  <span>{lang === 'en' ? item.en : item.label}</span>
                </NavLink>
              ))}

              {/* 通知铃铛（仅登录可见） */}
              <NotificationBell />

              {/* 账号区：未登录显示登录按钮，已登录显示头像（管理员头像右下角带盾牌徽章），点击进个人主页 */}
              {!isLoggedIn ? (
                <NavLink
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="md:ml-2 flex items-center space-x-1 px-4 py-1.5 rounded-full text-sm font-bold gradient-ningyuzhi text-green-950 hover:scale-105 transition-transform whitespace-nowrap"
                >
                  <User size={14} />
                  <span>{lang === 'en' ? 'Log in' : '登录'}</span>
                </NavLink>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/profile');
                  }}
                  title={authUser?.nickname || t('个人主页', 'Profile')}
                  aria-label={t('个人主页', 'Profile')}
                  className="md:ml-2 relative shrink-0 w-9 h-9 rounded-full hover:scale-105 transition-transform"
                >
                  <div className="w-9 h-9 rounded-full gradient-ningyuzhi shadow-sm flex items-center justify-center overflow-hidden">
                    {avatarIsUrl ? (
                      <img src={authUser!.avatarUrl!} alt={t('头像', 'Avatar')} className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} className="text-green-900" />
                    )}
                  </div>
                  {authIsAdmin && (
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white flex items-center justify-center ${badgeColor}`}
                    >
                      <ShieldCheck size={8} className="text-white" />
                    </span>
                  )}
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* 移动端遮罩：点空白处关闭抽屉（放在 header 外，避免 backdrop-blur 使 fixed 定位失效；仅移动端 md:hidden） */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label={t('关闭菜单', 'Close menu')}
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-200 animate-fadeIn"
        />
      )}

      <main className={`flex-grow ${isLanding ? '' : 'max-w-7xl mx-auto w-full px-4 pt-3 pb-8 md:py-8'}`}>{children}</main>

      <footer className="bg-white py-8 border-t border-[#E2F7C1]">
        <div className="text-center text-gray-400 text-sm font-medium">{t('© 2026 甜玉米 CP 应援站', '© 2026 SweetCorn CP Fan Station')}</div>
      </footer>
    </div>
  );
};

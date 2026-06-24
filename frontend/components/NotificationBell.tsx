import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useCurrentUser } from '../contexts/UserContext';
import { useLang } from '../contexts/LanguageContext';
import { getUnreadCount } from '../services/notificationService';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useCurrentUser();
  const { t } = useLang();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      setCount(0);
      return;
    }
    let cancelled = false;
    const load = () => {
      getUnreadCount()
        .then((c) => !cancelled && setCount(c))
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 60000); // 每 60 秒轮询
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  const badge = count > 99 ? '99+' : String(count);

  return (
    <button
      onClick={() => navigate('/notifications')}
      aria-label={t('通知', 'Notifications')}
      title={t('通知', 'Notifications')}
      className="relative shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-green-600 transition-colors"
    >
      <Bell size={20} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center leading-none">
          {badge}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;

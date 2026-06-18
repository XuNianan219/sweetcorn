import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

// 监听断网/恢复，顶部横幅提示
export const NetworkStatus: React.FC = () => {
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);
  const [justRecovered, setJustRecovered] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setOffline(true);
      setJustRecovered(false);
    };
    const handleOnline = () => {
      setOffline(false);
      setJustRecovered(true);
      const t = setTimeout(() => setJustRecovered(false), 3000);
      return () => clearTimeout(t);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (offline) {
    return (
      <div className="fixed top-0 inset-x-0 z-[100] bg-red-500 text-white text-sm font-bold py-2 px-4 flex items-center justify-center gap-2 shadow-md">
        <WifiOff size={16} />
        网络断开了，部分功能暂时不可用
      </div>
    );
  }

  if (justRecovered) {
    return (
      <div className="fixed top-0 inset-x-0 z-[100] bg-green-600 text-white text-sm font-bold py-2 px-4 flex items-center justify-center gap-2 shadow-md animate-fadeIn">
        <Wifi size={16} />
        网络已恢复
      </div>
    );
  }

  return null;
};

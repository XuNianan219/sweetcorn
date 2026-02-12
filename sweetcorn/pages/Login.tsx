
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService, TEST_USERS } from '../services/storage';
import { ShieldCheck, User as UserIcon, Lock, AlertCircle } from 'lucide-react';

export const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = TEST_USERS.find(u => u.username === username);
    if (foundUser && password === '123456') {
      StorageService.setCurrentUser(foundUser);
      onLogin();
      navigate('/'); // Ensure navigation to home page after login
    } else {
      setError('用户名或密码错误，或不在名额限制内');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcf9e8] p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-green-50 animate-fadeIn">
        <div className="text-center">
          <div className="w-20 h-20 gradient-ningyuzhi rounded-3xl mx-auto flex items-center justify-center text-green-900 mb-6 shadow-lg">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-900">甜玉米 · 成员登录</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium italic">此空间实行实名管理，请使用内部分配账号</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-400 font-medium"
                placeholder="用户名 (user1-user5)"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-400 font-medium"
                placeholder="登录密码"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 gradient-ningyuzhi text-green-900 font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
          >
            开启乐园之旅
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-400 font-medium">
            名额剩余: <span className="text-green-600">5 / 5</span>
          </p>
        </div>
      </div>
    </div>
  );
};

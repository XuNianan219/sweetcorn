import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, ShieldCheck, User as UserIcon } from 'lucide-react';
import { StorageService } from '../services/storage';

export const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = StorageService.getUsers().find((item) => item.username === username);
    if (foundUser && password === '123456') {
      StorageService.setCurrentUser(foundUser);
      onLogin();
      navigate('/');
      return;
    }
    setError('用户名或密码错误');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcf9e8] p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-green-50 animate-fadeIn">
        <div className="text-center">
          <div className="w-20 h-20 gradient-ningyuzhi rounded-3xl mx-auto flex items-center justify-center text-green-900 mb-6 shadow-lg">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-900">成员登录</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium italic">演示账号：admin、user1、user2、user3、user4</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100">
              <AlertCircle size={16} />
              {error}
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
                placeholder="用户名"
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
                placeholder="密码（123456）"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-4 gradient-ningyuzhi text-green-900 font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all">
            登录
          </button>
        </form>
      </div>
    </div>
  );
};

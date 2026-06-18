import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Phone, ShieldCheck } from 'lucide-react';
import { loginWithPassword, saveToken } from '../services/postsApi';
import { useCurrentUser } from '../contexts/UserContext';
import { showSuccess } from '../utils/toast';
import PageHeader from '../components/PageHeader';

export const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useCurrentUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^1\d{10}$/.test(phone.trim())) {
      setError('手机号格式不正确（11位数字，1开头）');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await loginWithPassword(phone.trim(), password);
      saveToken(token);
      setUser(user);
      showSuccess('登录成功');
      navigate('/');
    } catch (err: any) {
      setError(err?.message || '登录失败，请检查手机号/密码或后端是否启动');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcf9e8] p-4 relative">
      <div className="absolute top-3 inset-x-3">
        <PageHeader title="登录" showBack={false} />
      </div>
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-green-50 animate-fadeIn">
        <div className="text-center mb-8">
          <div className="w-20 h-20 gradient-ningyuzhi rounded-3xl mx-auto flex items-center justify-center text-green-900 mb-6 shadow-lg">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-900">成员登录</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">手机号 + 密码登录</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-400 font-medium"
              placeholder="请输入手机号"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-400 font-medium"
              placeholder="请输入密码"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !phone.trim() || !password}
            className="w-full py-4 gradient-ningyuzhi text-green-900 font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={20} className="animate-spin" />}
            登录
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-500">
            还没有账号？
            <Link to="/register" className="text-green-600 font-bold hover:text-green-700 ml-1">
              立即注册
            </Link>
          </p>
          <p className="text-xs text-gray-400">手机验证码登录功能即将上线</p>
        </div>
      </div>
    </div>
  );
};

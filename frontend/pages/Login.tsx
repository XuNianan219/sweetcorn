import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Phone, ShieldCheck } from 'lucide-react';
import { loginWithPassword, saveToken } from '../services/postsApi';
import { useCurrentUser } from '../contexts/UserContext';
import { useLang } from '../contexts/LanguageContext';
import { showSuccess } from '../utils/toast';

export const Login: React.FC = () => {
  const { t } = useLang();
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
      setError(t('手机号格式不正确（11位数字，1开头）', 'Invalid phone number (11 digits, starts with 1)'));
      return;
    }
    if (!password) {
      setError(t('请输入密码', 'Please enter your password'));
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await loginWithPassword(phone.trim(), password);
      saveToken(token);
      setUser(user);
      showSuccess(t('登录成功', 'Logged in'));
      navigate('/');
    } catch (err: any) {
      setError(err?.message || t('登录失败，请检查手机号/密码或后端是否启动', 'Login failed — check your phone/password or whether the server is running'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcf9e8] p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-green-50 animate-fadeIn">
        <div className="text-center mb-8">
          <div className="w-20 h-20 gradient-ningyuzhi rounded-3xl mx-auto flex items-center justify-center text-green-900 mb-6 shadow-lg">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-900">{t('成员登录', 'Member Login')}</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">{t('手机号 + 密码登录', 'Sign in with phone + password')}</p>
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
              placeholder={t('请输入手机号', 'Enter your phone number')}
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
              placeholder={t('请输入密码', 'Enter your password')}
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
            {t('登录', 'Log in')}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-500">
            {t('还没有账号？', 'No account yet?')}
            <Link to="/register" className="text-green-600 font-bold hover:text-green-700 ml-1">
              {t('立即注册', 'Sign up')}
            </Link>
          </p>
          <p className="text-xs text-gray-400">{t('手机验证码登录功能即将上线', 'SMS code login coming soon')}</p>
        </div>
      </div>
    </div>
  );
};

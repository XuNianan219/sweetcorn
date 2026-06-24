import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Phone, ShieldCheck, User } from 'lucide-react';
import { register, saveToken } from '../services/postsApi';
import { useCurrentUser } from '../contexts/UserContext';
import { useLang } from '../contexts/LanguageContext';
import { showSuccess } from '../utils/toast';

export const Register: React.FC = () => {
  const { t } = useLang();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useCurrentUser();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^1\d{10}$/.test(phone.trim())) {
      setError(t('手机号格式不正确（11位数字，1开头）', 'Invalid phone number (11 digits, starts with 1)'));
      return;
    }
    if (password.length < 6) {
      setError(t('密码至少6位', 'Password must be at least 6 characters'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('两次密码不一致', 'Passwords do not match'));
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await register(phone.trim(), password, nickname.trim() || undefined);
      saveToken(token);
      setUser(user);
      showSuccess(t('注册成功！', 'Registered!'));
      navigate('/');
    } catch (err: any) {
      setError(err?.message || t('注册失败，请稍后重试', 'Registration failed, please try again later'));
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
          <h2 className="text-3xl font-black text-gray-900">{t('注册账号', 'Create Account')}</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">{t('加入甜玉米成长乐园', 'Join the SweetCorn community')}</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
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
              placeholder={t('手机号（11位）', 'Phone number (11 digits)')}
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
              placeholder={t('密码（至少6位）', 'Password (min 6 characters)')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-400 font-medium"
              placeholder={t('确认密码', 'Confirm password')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-400 font-medium"
              placeholder={t('昵称（可选）', 'Nickname (optional)')}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !phone.trim() || !password || !confirmPassword}
            className="w-full py-4 gradient-ningyuzhi text-green-900 font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={20} className="animate-spin" />}
            {t('注册并登录', 'Register & log in')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {t('已有账号？', 'Already have an account?')}
            <Link to="/login" className="text-green-600 font-bold hover:text-green-700 ml-1">
              {t('返回登录', 'Back to login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

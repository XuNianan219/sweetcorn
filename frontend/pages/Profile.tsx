import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Loader2,
  LogOut,
  Pencil,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { getMe, updateMe, type ApiUser } from '../services/usersApi';
import { uploadMedia } from '../services/mediaService';
import { useCurrentUser } from '../contexts/UserContext';
import { RecycleBin } from '../components/RecycleBin';
import { FollowingList } from '../components/FollowingList';
import { ProfileSkeleton } from '../components/skeletons/ProfileSkeleton';
import PageHeader from '../components/PageHeader';
import { LazyImage } from '../components/LazyImage';
import { PullToRefreshWrapper } from '../components/PullToRefreshWrapper';
import { showSuccess, showError } from '../utils/toast';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

function maskPhone(phone?: string | null): string {
  if (!phone || phone.length < 7) return phone || '未绑定';
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  user: { label: '会员', className: 'bg-green-100 text-green-700' },
  admin: { label: '管理员', className: 'bg-yellow-100 text-yellow-700' },
  super_admin: { label: '超级管理员', className: 'bg-green-600 text-white' },
};

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, logout } = useCurrentUser();

  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 允许重复选同一文件
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      showError('只支持 JPG / PNG / WebP 图片');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      showError('图片不能超过 5MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const { url } = await uploadMedia(file);
      const updated = await updateMe({ avatarUrl: url });
      setProfile(updated);
      setUser(updated); // 同步 localStorage，Layout 头像随之更新
      setAvatarUrl(updated.avatarUrl || '');
      showSuccess('头像已更新');
    } catch (err: any) {
      showError(err?.message || '头像上传失败');
    } finally {
      setAvatarUploading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((u) => {
        if (cancelled) return;
        setProfile(u);
        setUser(u);
        setNickname(u.nickname || '');
        setAvatarUrl(u.avatarUrl || '');
      })
      .catch((e) => !cancelled && setError(e?.message || '加载失败'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateMe({ nickname: nickname.trim(), avatarUrl: avatarUrl.trim() });
      setProfile(updated);
      setUser(updated);
      setEditing(false);
      showSuccess('资料已保存');
    } catch (e: any) {
      setError(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNickname(profile?.nickname || '');
    setAvatarUrl(profile?.avatarUrl || '');
    setEditing(false);
  };

  const handleRefresh = async () => {
    try {
      const u = await getMe();
      setProfile(u);
      setUser(u);
      setNickname(u.nickname || '');
      setAvatarUrl(u.avatarUrl || '');
    } catch {
      /* 错误已由 apiClient toast */
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <p className="text-gray-500 font-medium">{error || '无法加载个人信息'}</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 gradient-ningyuzhi text-green-950 font-black rounded-2xl"
        >
          重新登录
        </button>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
  const badge = ROLE_BADGE[profile.role] || ROLE_BADGE.user;
  const isAvatarUrl = profile.avatarUrl && /^https?:\/\//.test(profile.avatarUrl);

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-16 animate-fadeIn">
      <PageHeader title="个人主页" />

      {/* 隐藏的头像文件选择 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleAvatarFile}
        className="hidden"
      />

      {/* 用户卡片 */}
      <div className="gradient-ningyuzhi rounded-[2.5rem] p-8 text-green-950 shadow-sm">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => !avatarUploading && fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="group relative w-24 h-24 rounded-3xl bg-white/70 shadow-inner flex items-center justify-center text-5xl overflow-hidden shrink-0 cursor-pointer"
            aria-label="修改头像"
          >
            {avatarUploading ? (
              <Loader2 size={28} className="animate-spin text-green-700" />
            ) : isAvatarUrl ? (
              <LazyImage src={profile.avatarUrl!} alt="头像" className="w-full h-full object-cover" />
            ) : (
              <span>🌽</span>
            )}
            {/* hover 浮层：桌面端 hover 显示，移动端常显 */}
            {!avatarUploading && (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/45 text-white text-[11px] font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <Camera size={18} />
                修改头像
              </span>
            )}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-black truncate">{profile.nickname || '玉米成员'}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-black ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <p className="mt-2 text-sm font-bold opacity-75">{maskPhone(profile.phone)}</p>
            <p className="text-xs font-medium opacity-60 mt-1">注册于 {formatDate(profile.createdAt)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-medium">{error}</div>
      )}

      {/* 我的关注 */}
      <FollowingList userId={profile.id} />

      {/* 资料编辑 */}
      <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-green-950">个人资料</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-xl font-bold text-sm transition-colors"
            >
              <Pencil size={15} />
              编辑资料
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
              >
                <X size={15} />
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 gradient-ningyuzhi text-green-950 rounded-xl font-black text-sm disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                保存
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <div className="divide-y divide-gray-50">
            <Row label="昵称" value={profile.nickname || '—'} />
            <Row label="手机号" value={maskPhone(profile.phone)} />
            <Row label="头像链接" value={profile.avatarUrl || '未设置'} />
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block">昵称</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="给自己起个昵称"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-100 outline-none font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block">
                头像链接（暂只支持填 URL，上传功能稍后上线）
              </label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-100 outline-none font-medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* 管理员后台入口 */}
      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          className="w-full gradient-ningyuzhi rounded-[2rem] p-6 text-green-950 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform"
        >
          <span className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center">
              <ShieldCheck size={22} />
            </span>
            <span className="text-left">
              <span className="block font-black text-lg">管理员后台</span>
              <span className="block text-xs font-medium opacity-70">管理用户、角色与封禁</span>
            </span>
          </span>
          <span className="text-2xl font-black">→</span>
        </button>
      )}

      {/* 日记管理入口（仅管理员） */}
      {isAdmin && (
        <div className="w-full gradient-ningyuzhi rounded-[2rem] p-6 text-green-950 shadow-sm flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin/timeline')}
            className="flex items-center gap-3 text-left min-w-0 flex-grow hover:opacity-90 transition-opacity"
          >
            <span className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center shrink-0">
              <Pencil size={22} />
            </span>
            <span className="min-w-0">
              <span className="block font-black text-lg">日记管理</span>
              <span className="block text-xs font-medium opacity-70">编辑甜玉米日记的时间线条目</span>
            </span>
          </button>
          <button
            onClick={() => navigate('/admin/timeline/new')}
            className="shrink-0 px-4 py-2 bg-white/70 rounded-xl font-black text-sm hover:bg-white transition-colors"
          >
            + 添加新条目
          </button>
        </div>
      )}

      {/* 我的回收站 */}
      <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Trash2 size={22} />
          </span>
          <div>
            <h2 className="text-lg font-black text-green-950">我的回收站</h2>
            <p className="text-xs text-gray-400 font-medium">我删除的帖子，30 天内可恢复</p>
          </div>
        </div>
        <RecycleBin />
      </div>

      {/* 退出登录 */}
      <button
        onClick={logout}
        className="w-full py-4 bg-white border-2 border-red-200 rounded-2xl font-black text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={18} />
        退出登录
      </button>
    </div>
    </PullToRefreshWrapper>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center gap-3 py-3">
    <div className="text-sm text-gray-400 font-medium w-20 shrink-0">{label}</div>
    <div className="text-sm font-bold text-gray-800 truncate">{value}</div>
  </div>
);

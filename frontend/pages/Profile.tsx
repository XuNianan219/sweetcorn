import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Headphones,
  Loader2,
  LogOut,
  MessageCircle,
  Pencil,
  Save,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { getMe, updateMe, type ApiUser } from '../services/usersApi';
import { getSupportContact } from '../services/messageService';
import { ChatDrawer } from '../components/ChatDrawer';
import { uploadMedia } from '../services/mediaService';
import { useCurrentUser } from '../contexts/UserContext';
import { useLang } from '../contexts/LanguageContext';
import { RecycleBin } from '../components/RecycleBin';
import { MyIdeas } from '../components/MyIdeas';
import { MyProducts } from '../components/MyProducts';
import { LanguageToggle } from '../components/LanguageToggle';
import { ProfileSkeleton } from '../components/skeletons/ProfileSkeleton';
import PageHeader from '../components/PageHeader';
import { LazyImage } from '../components/LazyImage';
import { PullToRefreshWrapper } from '../components/PullToRefreshWrapper';
import { showSuccess, showError } from '../utils/toast';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

function maskPhone(phone: string | null | undefined, notBound: string): string {
  if (!phone || phone.length < 7) return phone || notBound;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const ROLE_BADGE: Record<string, { label: string; labelEn: string; className: string }> = {
  user: { label: '会员', labelEn: 'Member', className: 'bg-green-100 text-green-700' },
  admin: { label: '管理员', labelEn: 'Admin', className: 'bg-yellow-100 text-yellow-700' },
  super_admin: { label: '超级管理员', labelEn: 'Super Admin', className: 'bg-green-600 text-white' },
};

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, logout } = useCurrentUser();
  const { t, lang } = useLang();

  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // 官方客服聊天（仿淘宝：藏在个人页面）。走 commerce，不受私信条数限制。
  const [supportTarget, setSupportTarget] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
  const [supportBusy, setSupportBusy] = useState(false);

  const handleContactSupport = async () => {
    if (supportBusy) return;
    setSupportBusy(true);
    try {
      const s = await getSupportContact();
      setSupportTarget({ id: s.id, name: s.nickname || t('官方客服', 'Support'), avatar: s.avatarUrl });
    } catch {
      /* 错误已由 apiClient toast */
    } finally {
      setSupportBusy(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 允许重复选同一文件
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      showError(t('只支持 JPG / PNG / WebP 图片', 'Only JPG / PNG / WebP images are supported'));
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      showError(t('图片不能超过 5MB', 'Image must be under 5MB'));
      return;
    }

    setAvatarUploading(true);
    try {
      const { url } = await uploadMedia(file);
      const updated = await updateMe({ avatarUrl: url });
      setProfile(updated);
      setUser(updated); // 同步 localStorage，Layout 头像随之更新
      setAvatarUrl(updated.avatarUrl || '');
      showSuccess(t('头像已更新', 'Avatar updated'));
    } catch (err: any) {
      showError(err?.message || t('头像上传失败', 'Avatar upload failed'));
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
        setBio(u.bio || '');
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
      const updated = await updateMe({ nickname: nickname.trim(), bio: bio.trim() });
      setProfile(updated);
      setUser(updated);
      setEditing(false);
      showSuccess(t('资料已保存', 'Profile saved'));
    } catch (e: any) {
      setError(e?.message || t('保存失败', 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNickname(profile?.nickname || '');
    setBio(profile?.bio || '');
    setEditing(false);
  };

  const handleRefresh = async () => {
    try {
      const u = await getMe();
      setProfile(u);
      setUser(u);
      setNickname(u.nickname || '');
      setAvatarUrl(u.avatarUrl || '');
      setBio(u.bio || '');
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
        <p className="text-gray-500 font-medium">{error || t('无法加载个人信息', 'Could not load profile')}</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 gradient-ningyuzhi text-green-950 font-black rounded-2xl"
        >
          {t('重新登录', 'Log in again')}
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
      <PageHeader title={t('个人主页', 'Profile')} />

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
            aria-label={t('修改头像', 'Change avatar')}
          >
            {avatarUploading ? (
              <Loader2 size={28} className="animate-spin text-green-700" />
            ) : isAvatarUrl ? (
              <LazyImage src={profile.avatarUrl!} alt={t('头像', 'Avatar')} className="w-full h-full object-cover" />
            ) : (
              <span>🌽</span>
            )}
            {/* hover 浮层：桌面端 hover 显示，移动端常显 */}
            {!avatarUploading && (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/45 text-white text-[11px] font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <Camera size={18} />
                {t('修改头像', 'Change avatar')}
              </span>
            )}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-black truncate">{profile.nickname || t('玉米成员', 'Corn member')}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-black ${badge.className}`}>
                {lang === 'en' ? badge.labelEn : badge.label}
              </span>
            </div>
            <p className="mt-1.5 text-sm font-medium opacity-80 line-clamp-2">
              {profile.bio?.trim() || t('这个人很懒，什么都没留下~', 'This corn left no bio yet~')}
            </p>
            <p className="mt-1 text-sm font-bold opacity-75">{maskPhone(profile.phone, t('未绑定', 'Not linked'))}</p>
            <p className="text-xs font-medium opacity-60 mt-1">{t('注册于', 'Joined')} {formatDate(profile.createdAt)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-medium">{error}</div>
      )}

      {/* 个人资料（置于用户卡正下方） */}
      <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-green-950">{t('个人资料', 'Profile info')}</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-xl font-bold text-sm transition-colors"
            >
              <Pencil size={15} />
              {t('编辑资料', 'Edit')}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
              >
                <X size={15} />
                {t('取消', 'Cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 gradient-ningyuzhi text-green-950 rounded-xl font-black text-sm disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {t('保存', 'Save')}
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <div className="divide-y divide-gray-50">
            <Row label={t('昵称', 'Nickname')} value={profile.nickname || '—'} />
            <Row label={t('个性签名', 'Bio')} value={profile.bio?.trim() || t('未设置', 'Not set')} />
            <Row label={t('手机号', 'Phone')} value={maskPhone(profile.phone, t('未绑定', 'Not linked'))} />
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block">{t('昵称', 'Nickname')}</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('给自己起个昵称', 'Pick a nickname')}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-100 outline-none font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block">
                {t('个性签名（最多 100 字）', 'Bio (max 100 chars)')}
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 100))}
                rows={2}
                placeholder={t('写一句话介绍自己吧~', 'Say a little about yourself~')}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-100 outline-none font-medium resize-none"
              />
              <div className="text-right text-[11px] text-gray-300 mt-1">{bio.length}/100</div>
            </div>
          </div>
        )}

        {/* 语言设置（从导航栏移来；复用全局语言开关） */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="text-sm text-gray-400 font-medium">{t('语言', 'Language')} / Language</div>
          <LanguageToggle />
        </div>
      </div>

      {/* 我的私信入口 */}
      <button
        onClick={() => navigate('/messages')}
        className="w-full bg-white rounded-[2rem] border border-green-50 shadow-sm p-5 flex items-center gap-3 hover:border-green-200 transition-colors"
      >
        <span className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
          <MessageCircle size={22} />
        </span>
        <span className="text-left flex-grow">
          <span className="block font-black text-green-950">{t('我的私信', 'Messages')}</span>
          <span className="block text-xs text-gray-400 font-medium">{t('查看与其他玉米的聊天', 'Your chats with other corns')}</span>
        </span>
        <span className="text-gray-300 text-xl font-black">→</span>
      </button>

      {/* 我的购物车 */}
      <button
        onClick={() => navigate('/cart')}
        className="w-full bg-white rounded-[2rem] border border-green-50 shadow-sm p-5 flex items-center gap-3 hover:border-green-200 transition-colors"
      >
        <span className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
          <ShoppingCart size={22} />
        </span>
        <span className="text-left flex-grow">
          <span className="block font-black text-green-950">{t('我的购物车', 'My cart')}</span>
          <span className="block text-xs text-gray-400 font-medium">{t('查看已加入购物车的周边', 'Items you added to cart')}</span>
        </span>
        <span className="text-gray-300 text-xl font-black">→</span>
      </button>

      {/* 客服入口：管理员显示「处理客诉」进后台处理台；普通用户显示「联系官方客服」开聊天 */}
      <button
        onClick={isAdmin ? () => navigate('/complaints') : handleContactSupport}
        disabled={!isAdmin && supportBusy}
        className="w-full bg-white rounded-[2rem] border border-green-50 shadow-sm p-5 flex items-center gap-3 hover:border-green-200 transition-colors disabled:opacity-60"
      >
        <span className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
          {!isAdmin && supportBusy ? <Loader2 size={20} className="animate-spin" /> : <Headphones size={22} />}
        </span>
        <span className="text-left flex-grow">
          <span className="block font-black text-green-950">
            {isAdmin ? t('处理客诉', 'Handle complaints') : t('联系官方客服', 'Contact support')}
          </span>
          <span className="block text-xs text-gray-400 font-medium">
            {isAdmin
              ? t('查看并回复所有用户的客诉', 'View & reply to all user complaints')
              : t('账号、订单或其他问题，找官方客服', 'Account, orders or anything else')}
          </span>
        </span>
        <span className="text-gray-300 text-xl font-black">→</span>
      </button>

      {/* 我的关注入口 → 完整关注列表页 */}
      <button
        onClick={() => navigate('/following')}
        className="w-full bg-white rounded-[2rem] border border-green-50 shadow-sm p-5 flex items-center gap-3 hover:border-green-200 transition-colors"
      >
        <span className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
          <Users size={22} />
        </span>
        <span className="text-left flex-grow">
          <span className="block font-black text-green-950">{t('我的关注', 'Following')}</span>
          <span className="block text-xs text-gray-400 font-medium">{t('查看、取关或私信关注的人', 'View, unfollow or message people you follow')}</span>
        </span>
        <span className="text-gray-300 text-xl font-black">→</span>
      </button>

      {/* 我发布的商品 */}
      <MyProducts />

      {/* 我的创意（周边创意审核状态） */}
      <MyIdeas />

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
              <span className="block font-black text-lg">{t('管理员后台', 'Admin Panel')}</span>
              <span className="block text-xs font-medium opacity-70">{t('管理用户、角色与封禁', 'Manage users, roles & bans')}</span>
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
              <span className="block font-black text-lg">{t('日记管理', 'Diary Manager')}</span>
              <span className="block text-xs font-medium opacity-70">{t('编辑甜玉米日记的时间线条目', 'Edit SweetCorn diary entries')}</span>
            </span>
          </button>
          <button
            onClick={() => navigate('/admin/timeline/new')}
            className="shrink-0 px-4 py-2 bg-white/70 rounded-xl font-black text-sm hover:bg-white transition-colors"
          >
            {t('+ 添加新条目', '+ New entry')}
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
            <h2 className="text-lg font-black text-green-950">{t('我的回收站', 'Recycle Bin')}</h2>
            <p className="text-xs text-gray-400 font-medium">{t('我删除的帖子，30 天内可恢复', 'Posts you deleted — recoverable within 30 days')}</p>
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
        {t('退出登录', 'Log out')}
      </button>

      {/* 官方客服聊天框（commerce，无条数限制） */}
      {supportTarget && (
        <ChatDrawer
          open={!!supportTarget}
          onClose={() => setSupportTarget(null)}
          userId={supportTarget.id}
          partnerName={supportTarget.name}
          partnerAvatar={supportTarget.avatar}
          kind="commerce"
        />
      )}
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

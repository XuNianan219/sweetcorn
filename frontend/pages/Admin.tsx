import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Headphones,
  Pin,
  ShieldCheck,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import {
  adminListUsers,
  adminSetRole,
  adminSetStatus,
  type ApiUser,
} from '../services/usersApi';
import {
  approveEvent,
  getPendingEvents,
  pinEvent,
  rejectEvent,
  type EventItem,
  EVENT_TYPE_META,
  EVENT_TYPE_META_EN,
  formatEventDate,
} from '../services/eventsService';
import { useCurrentUser } from '../contexts/UserContext';
import { useLang } from '../contexts/LanguageContext';
import {
  getPendingIdeas,
  approveIdea,
  rejectIdea,
  type Idea,
} from '../services/merchandiseService';
import { AdminSupport } from '../components/AdminSupport';

type AdminTab = 'users' | 'events' | 'ideas' | 'support';

const PAGE_SIZE = 20;

const ROLE_LABEL: Record<string, string> = {
  user: '会员',
  admin: '管理员',
  super_admin: '超级管理员',
};
const ROLE_LABEL_EN: Record<string, string> = {
  user: 'Member',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();
  const { t, lang } = useLang();
  const isSuperAdmin = user?.role === 'super_admin';

  const [tab, setTab] = useState<AdminTab>('users');

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // 待审核活动
  const [pending, setPending] = useState<EventItem[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectKind, setRejectKind] = useState<'event' | 'idea'>('event');
  const [rejectReason, setRejectReason] = useState('');

  // 待审核创意
  const [pendingIdeas, setPendingIdeas] = useState<Idea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = (p: number) => {
    setLoading(true);
    setError('');
    adminListUsers(p, PAGE_SIZE)
      .then((res) => {
        setUsers(res.users);
        setTotal(res.total);
        setPage(res.page);
      })
      .catch((e) => setError(e?.message || t('加载失败', 'Failed to load')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // 前端兜底：非管理员看到无权限页（后端也已拦截）
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-400 mx-auto flex items-center justify-center">
          <Ban size={32} />
        </div>
        <h1 className="text-2xl font-black text-gray-800">{t('无权限访问', 'No access')}</h1>
        <p className="text-gray-500 font-medium">{t('该页面仅限管理员访问', 'This page is for admins only')}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 gradient-ningyuzhi text-green-950 font-black rounded-2xl"
        >
          {t('返回首页', 'Back home')}
        </button>
      </div>
    );
  }

  const patchLocal = (updated: ApiUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
  };

  const handleToggleStatus = async (u: ApiUser) => {
    const next = u.status === 'banned' ? 'active' : 'banned';
    setBusyId(u.id);
    setError('');
    try {
      patchLocal(await adminSetStatus(u.id, next));
    } catch (e: any) {
      setError(e?.message || t('操作失败', 'Action failed'));
    } finally {
      setBusyId(null);
    }
  };

  const handleChangeRole = async (u: ApiUser, role: ApiUser['role']) => {
    setBusyId(u.id);
    setError('');
    try {
      patchLocal(await adminSetRole(u.id, role));
    } catch (e: any) {
      setError(e?.message || t('操作失败', 'Action failed'));
    } finally {
      setBusyId(null);
    }
  };

  // ─── 活动审核 ───
  const loadPending = () => {
    setPendingLoading(true);
    setError('');
    getPendingEvents()
      .then(setPending)
      .catch((e) => setError(e?.message || t('加载失败', 'Failed to load')))
      .finally(() => setPendingLoading(false));
  };

  useEffect(() => {
    if (isAdmin && tab === 'events') loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, tab]);

  // ─── 创意审核 ───
  const loadPendingIdeas = () => {
    setIdeasLoading(true);
    setError('');
    getPendingIdeas()
      .then(setPendingIdeas)
      .catch((e) => setError(e?.message || t('加载失败', 'Failed to load')))
      .finally(() => setIdeasLoading(false));
  };

  useEffect(() => {
    if (isAdmin && tab === 'ideas') loadPendingIdeas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, tab]);

  const handleApproveIdea = async (idea: Idea) => {
    setBusyId(idea.id);
    setError('');
    try {
      await approveIdea(idea.id);
      setPendingIdeas((prev) => prev.filter((i) => i.id !== idea.id));
    } catch (e: any) {
      setError(e?.message || t('操作失败', 'Action failed'));
    } finally {
      setBusyId(null);
    }
  };

  const removeFromPending = (id: string) => setPending((prev) => prev.filter((e) => e.id !== id));

  const handleApprove = async (ev: EventItem) => {
    setBusyId(ev.id);
    setError('');
    try {
      await approveEvent(ev.id);
      removeFromPending(ev.id);
    } catch (e: any) {
      setError(e?.message || t('操作失败', 'Action failed'));
    } finally {
      setBusyId(null);
    }
  };

  const handlePin = async (ev: EventItem) => {
    setBusyId(ev.id);
    setError('');
    try {
      const updated = await pinEvent(ev.id, !ev.isPinned);
      setPending((prev) => prev.map((e) => (e.id === ev.id ? { ...e, isPinned: updated.isPinned } : e)));
    } catch (e: any) {
      setError(e?.message || t('操作失败', 'Action failed'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectingId) return;
    setBusyId(rejectingId);
    setError('');
    try {
      if (rejectKind === 'idea') {
        await rejectIdea(rejectingId, rejectReason.trim());
        setPendingIdeas((prev) => prev.filter((i) => i.id !== rejectingId));
      } else {
        await rejectEvent(rejectingId, rejectReason.trim());
        removeFromPending(rejectingId);
      }
      setRejectingId(null);
      setRejectReason('');
    } catch (e: any) {
      setError(e?.message || t('操作失败', 'Action failed'));
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (id: string, kind: 'event' | 'idea') => {
    setRejectKind(kind);
    setRejectingId(id);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 md:pb-16 animate-fadeIn">
      <PageHeader />
      <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl gradient-ningyuzhi flex items-center justify-center text-green-950">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-green-950">{t('管理员后台', 'Admin Panel')}</h1>
          <p className="text-sm text-gray-400 font-medium">{t('仅管理员可见', 'Visible to admins only')}</p>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            tab === 'users' ? 'gradient-ningyuzhi text-green-950 shadow-sm' : 'bg-white text-gray-500 border border-green-50 hover:text-green-600'
          }`}
        >
          <UsersIcon size={15} />
          {t('用户管理', 'Users')}
        </button>
        <button
          onClick={() => setTab('events')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            tab === 'events' ? 'gradient-ningyuzhi text-green-950 shadow-sm' : 'bg-white text-gray-500 border border-green-50 hover:text-green-600'
          }`}
        >
          <CheckCircle2 size={15} />
          {t('待审核活动', 'Pending events')}
          {pending.length > 0 && (
            <span className="px-1.5 py-0.5 bg-green-600 text-white rounded-full text-[10px] leading-none">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('ideas')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            tab === 'ideas' ? 'gradient-ningyuzhi text-green-950 shadow-sm' : 'bg-white text-gray-500 border border-green-50 hover:text-green-600'
          }`}
        >
          <CheckCircle2 size={15} />
          {t('待审核创意', 'Pending ideas')}
          {pendingIdeas.length > 0 && (
            <span className="px-1.5 py-0.5 bg-green-600 text-white rounded-full text-[10px] leading-none">
              {pendingIdeas.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('support')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            tab === 'support' ? 'gradient-ningyuzhi text-green-950 shadow-sm' : 'bg-white text-gray-500 border border-green-50 hover:text-green-600'
          }`}
        >
          <Headphones size={15} />
          {t('客服消息', 'Support')}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-medium">{error}</div>
      )}

      {tab === 'users' && (
      <>
      <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20 text-gray-400">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="px-4 py-3 font-bold">{t('用户', 'User')}</th>
                  <th className="px-4 py-3 font-bold">{t('手机号', 'Phone')}</th>
                  <th className="px-4 py-3 font-bold">{t('角色', 'Role')}</th>
                  <th className="px-4 py-3 font-bold">{t('状态', 'Status')}</th>
                  <th className="px-4 py-3 font-bold">{t('注册时间', 'Joined')}</th>
                  <th className="px-4 py-3 font-bold">{t('操作', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const banned = u.status === 'banned';
                  const isAvatarUrl = u.avatarUrl && /^https?:\/\//.test(u.avatarUrl);
                  return (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-lg overflow-hidden shrink-0">
                            {isAvatarUrl ? (
                              <img src={u.avatarUrl!} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>🌽</span>
                            )}
                          </div>
                          <span className="font-bold text-gray-800 whitespace-nowrap">
                            {u.nickname || t('未命名', 'Unnamed')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{u.phone}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isSuperAdmin ? (
                          <select
                            value={u.role}
                            disabled={busyId === u.id}
                            onChange={(e) => handleChangeRole(u, e.target.value as ApiUser['role'])}
                            className="text-xs font-bold bg-gray-50 border border-green-100 rounded-lg px-2 py-1.5 text-green-700 outline-none disabled:opacity-50"
                          >
                            <option value="user">{t('会员', 'Member')}</option>
                            <option value="admin">{t('管理员', 'Admin')}</option>
                            <option value="super_admin">{t('超级管理员', 'Super Admin')}</option>
                          </select>
                        ) : (
                          <span className="text-xs font-bold text-gray-700">{lang === 'en' ? ROLE_LABEL_EN[u.role] : ROLE_LABEL[u.role]}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-black ${
                            banned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {banned ? t('已封禁', 'Banned') : t('正常', 'Active')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={busyId === u.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                            banned
                              ? 'text-green-700 bg-green-50 hover:bg-green-100'
                              : 'text-red-600 bg-red-50 hover:bg-red-100'
                          }`}
                        >
                          {busyId === u.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : banned ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <Ban size={14} />
                          )}
                          {banned ? t('解封', 'Unban') : t('封禁', 'Ban')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => load(page - 1)}
          disabled={page <= 1 || loading}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white border border-green-50 font-bold text-sm text-gray-600 disabled:opacity-40 hover:bg-green-50 transition-colors"
        >
          <ChevronLeft size={16} />
          {t('上一页', 'Prev')}
        </button>
        <span className="text-sm font-bold text-gray-500">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => load(page + 1)}
          disabled={page >= totalPages || loading}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white border border-green-50 font-bold text-sm text-gray-600 disabled:opacity-40 hover:bg-green-50 transition-colors"
        >
          {t('下一页', 'Next')}
          <ChevronRight size={16} />
        </button>
      </div>
      </>
      )}

      {/* ───── 待审核活动 ───── */}
      {tab === 'events' && (
        <div className="space-y-4">
          {pendingLoading ? (
            <div className="flex justify-center py-16 text-gray-400">
              <Loader2 size={28} className="animate-spin" />
            </div>
          ) : pending.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm text-center py-16 text-gray-400 font-medium">
              {t('暂无待审核活动', 'No pending events')}
            </div>
          ) : (
            pending.map((ev) => {
              const meta = EVENT_TYPE_META[ev.eventType];
              const metaLabel = lang === 'en' ? EVENT_TYPE_META_EN[ev.eventType].label : meta.label;
              const busy = busyId === ev.id;
              return (
                <div key={ev.id} className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-5 flex flex-col sm:flex-row gap-4">
                  {ev.coverImage ? (
                    <img src={ev.coverImage} alt={ev.title} className="w-full sm:w-36 h-28 object-cover rounded-xl shrink-0" />
                  ) : (
                    <div className="w-full sm:w-36 h-28 gradient-ningyuzhi rounded-xl flex items-center justify-center text-3xl shrink-0">
                      {meta.emoji}
                    </div>
                  )}

                  <div className="flex-grow min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-green-100 text-green-700">
                        {meta.emoji} {metaLabel}
                      </span>
                      {ev.isPinned && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-yellow-100 text-yellow-700">{t('已置顶', 'Pinned')}</span>
                      )}
                      {ev.celebrities.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600">{c}</span>
                      ))}
                    </div>
                    <h3 className="font-black text-gray-900">{ev.title}</h3>
                    {ev.description && <p className="text-sm text-gray-500 font-medium line-clamp-2">{ev.description}</p>}
                    <p className="text-xs text-gray-400 font-medium">
                      {formatEventDate(ev.startAt, lang)}
                      {ev.location ? ` · ${ev.location}` : ''}
                      {ev.submitter ? ` · ${t('提交人', 'by')} ${ev.submitter.nickname || ev.submitter.phone}` : ''}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(ev)}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black gradient-ningyuzhi text-green-950 disabled:opacity-50"
                      >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        {t('通过', 'Approve')}
                      </button>
                      <button
                        onClick={() => openReject(ev.id, 'event')}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Ban size={14} />
                        {t('拒绝', 'Reject')}
                      </button>
                      <button
                        onClick={() => handlePin(ev)}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                      >
                        <Pin size={14} />
                        {ev.isPinned ? t('取消置顶', 'Unpin') : t('置顶', 'Pin')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ───── 待审核创意 ───── */}
      {tab === 'ideas' && (
        <div className="space-y-4">
          {ideasLoading ? (
            <div className="flex justify-center py-16 text-gray-400">
              <Loader2 size={28} className="animate-spin" />
            </div>
          ) : pendingIdeas.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm text-center py-16 text-gray-400 font-medium">
              {t('暂无待审核创意', 'No pending ideas')}
            </div>
          ) : (
            pendingIdeas.map((idea) => {
              const busy = busyId === idea.id;
              const cover = idea.designImages?.[0];
              return (
                <div key={idea.id} className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-5 flex flex-col sm:flex-row gap-4">
                  {cover ? (
                    <img src={cover} alt={idea.name} className="w-full sm:w-36 h-28 object-cover rounded-xl shrink-0" />
                  ) : (
                    <div className="w-full sm:w-36 h-28 gradient-ningyuzhi rounded-xl flex items-center justify-center text-3xl shrink-0">💡</div>
                  )}
                  <div className="flex-grow min-w-0 space-y-1.5">
                    <h3 className="font-black text-gray-900">{idea.name}</h3>
                    {idea.description && <p className="text-sm text-gray-500 font-medium line-clamp-2">{idea.description}</p>}
                    <p className="text-xs text-gray-400 font-medium">
                      {t('目标', 'Goal')} {idea.targetPeople} {t('人', '')} · {t('预估', 'Est.')} ¥{idea.estimatedCost}
                      {idea.author ? ` · ${t('提交人', 'by')} ${idea.author.nickname || idea.author.phone || ''}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => handleApproveIdea(idea)}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black gradient-ningyuzhi text-green-950 disabled:opacity-50"
                      >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        {t('通过并上架众筹', 'Approve & list')}
                      </button>
                      <button
                        onClick={() => openReject(idea.id, 'idea')}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Ban size={14} />
                        {t('拒绝', 'Reject')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ───── 客服消息 ───── */}
      {tab === 'support' && <AdminSupport />}

      {/* 拒绝原因弹窗 */}
      {rejectingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setRejectingId(null);
              setRejectReason('');
            }
          }}
        >
          <div className="bg-white rounded-[2rem] shadow-2xl border border-green-50 p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-green-950">{t('拒绝原因', 'Rejection reason')}</h3>
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason('');
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
              >
                <X size={14} />
              </button>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('请填写拒绝原因，提交人可在「我提交的」中看到', 'Enter a reason — the submitter can see it under "My submissions"')}
              className="w-full h-28 p-4 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-100 outline-none resize-none font-medium"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason('');
                }}
                className="flex-1 py-3 rounded-2xl bg-gray-50 text-gray-500 font-black hover:bg-gray-100"
              >
                {t('取消', 'Cancel')}
              </button>
              <button
                onClick={confirmReject}
                disabled={busyId === rejectingId}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busyId === rejectingId && <Loader2 size={16} className="animate-spin" />}
                {t('确认拒绝', 'Confirm reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

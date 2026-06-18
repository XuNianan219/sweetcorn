import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
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
  formatEventDate,
} from '../services/eventsService';
import { useCurrentUser } from '../contexts/UserContext';

type AdminTab = 'users' | 'events';

const PAGE_SIZE = 20;

const ROLE_LABEL: Record<string, string> = {
  user: '会员',
  admin: '管理员',
  super_admin: '超级管理员',
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
  const [rejectReason, setRejectReason] = useState('');

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
      .catch((e) => setError(e?.message || '加载失败'))
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
        <h1 className="text-2xl font-black text-gray-800">无权限访问</h1>
        <p className="text-gray-500 font-medium">该页面仅限管理员访问</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 gradient-ningyuzhi text-green-950 font-black rounded-2xl"
        >
          返回首页
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
      setError(e?.message || '操作失败');
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
      setError(e?.message || '操作失败');
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
      .catch((e) => setError(e?.message || '加载失败'))
      .finally(() => setPendingLoading(false));
  };

  useEffect(() => {
    if (isAdmin && tab === 'events') loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, tab]);

  const removeFromPending = (id: string) => setPending((prev) => prev.filter((e) => e.id !== id));

  const handleApprove = async (ev: EventItem) => {
    setBusyId(ev.id);
    setError('');
    try {
      await approveEvent(ev.id);
      removeFromPending(ev.id);
    } catch (e: any) {
      setError(e?.message || '操作失败');
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
      setError(e?.message || '操作失败');
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectingId) return;
    setBusyId(rejectingId);
    setError('');
    try {
      await rejectEvent(rejectingId, rejectReason.trim());
      removeFromPending(rejectingId);
      setRejectingId(null);
      setRejectReason('');
    } catch (e: any) {
      setError(e?.message || '操作失败');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 md:pb-16 animate-fadeIn">
      <PageHeader />
      <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl gradient-ningyuzhi flex items-center justify-center text-green-950">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-green-950">管理员后台</h1>
          <p className="text-sm text-gray-400 font-medium">仅管理员可见</p>
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
          用户管理
        </button>
        <button
          onClick={() => setTab('events')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            tab === 'events' ? 'gradient-ningyuzhi text-green-950 shadow-sm' : 'bg-white text-gray-500 border border-green-50 hover:text-green-600'
          }`}
        >
          <CheckCircle2 size={15} />
          待审核活动
          {pending.length > 0 && (
            <span className="px-1.5 py-0.5 bg-green-600 text-white rounded-full text-[10px] leading-none">
              {pending.length}
            </span>
          )}
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
                  <th className="px-4 py-3 font-bold">用户</th>
                  <th className="px-4 py-3 font-bold">手机号</th>
                  <th className="px-4 py-3 font-bold">角色</th>
                  <th className="px-4 py-3 font-bold">状态</th>
                  <th className="px-4 py-3 font-bold">注册时间</th>
                  <th className="px-4 py-3 font-bold">操作</th>
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
                            {u.nickname || '未命名'}
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
                            <option value="user">会员</option>
                            <option value="admin">管理员</option>
                            <option value="super_admin">超级管理员</option>
                          </select>
                        ) : (
                          <span className="text-xs font-bold text-gray-700">{ROLE_LABEL[u.role]}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-black ${
                            banned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {banned ? '已封禁' : '正常'}
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
                          {banned ? '解封' : '封禁'}
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
          上一页
        </button>
        <span className="text-sm font-bold text-gray-500">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => load(page + 1)}
          disabled={page >= totalPages || loading}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white border border-green-50 font-bold text-sm text-gray-600 disabled:opacity-40 hover:bg-green-50 transition-colors"
        >
          下一页
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
              暂无待审核活动
            </div>
          ) : (
            pending.map((ev) => {
              const meta = EVENT_TYPE_META[ev.eventType];
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
                        {meta.emoji} {meta.label}
                      </span>
                      {ev.isPinned && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-yellow-100 text-yellow-700">已置顶</span>
                      )}
                      {ev.celebrities.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600">{c}</span>
                      ))}
                    </div>
                    <h3 className="font-black text-gray-900">{ev.title}</h3>
                    {ev.description && <p className="text-sm text-gray-500 font-medium line-clamp-2">{ev.description}</p>}
                    <p className="text-xs text-gray-400 font-medium">
                      {formatEventDate(ev.startAt)}
                      {ev.location ? ` · ${ev.location}` : ''}
                      {ev.submitter ? ` · 提交人 ${ev.submitter.nickname || ev.submitter.phone}` : ''}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(ev)}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black gradient-ningyuzhi text-green-950 disabled:opacity-50"
                      >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        通过
                      </button>
                      <button
                        onClick={() => setRejectingId(ev.id)}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Ban size={14} />
                        拒绝
                      </button>
                      <button
                        onClick={() => handlePin(ev)}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                      >
                        <Pin size={14} />
                        {ev.isPinned ? '取消置顶' : '置顶'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

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
              <h3 className="text-lg font-black text-green-950">拒绝原因</h3>
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
              placeholder="请填写拒绝原因，提交人可在「我提交的」中看到"
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
                取消
              </button>
              <button
                onClick={confirmReject}
                disabled={busyId === rejectingId}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busyId === rejectingId && <Loader2 size={16} className="animate-spin" />}
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

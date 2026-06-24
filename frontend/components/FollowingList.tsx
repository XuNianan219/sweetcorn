import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MessageCircle, UserMinus, Users } from 'lucide-react';
import { getFollowing, toggleFollow, type FollowUser } from '../services/followService';
import { showSuccess } from '../utils/toast';
import { useLang } from '../contexts/LanguageContext';

interface FollowingListProps {
  userId: string;
}

export const FollowingList: React.FC<FollowingListProps> = ({ userId }) => {
  const { t } = useLang();
  const navigate = useNavigate();
  const [list, setList] = useState<FollowUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getFollowing(userId, 1, 20)
      .then((res) => {
        if (cancelled) return;
        setList(res.following);
        setTotal(res.total);
      })
      .catch((e) => !cancelled && setError(e?.message || '加载失败'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const goAuthor = (u: FollowUser) => {
    navigate(`/users/${u.id}`);
  };

  const handleUnfollow = async (u: FollowUser) => {
    if (busyId) return;
    const who = u.nickname || t('该用户', 'this user');
    if (!window.confirm(t(`确定取消关注 ${who}?`, `Unfollow ${who}?`))) return;
    setBusyId(u.id);
    setError('');
    try {
      await toggleFollow(u.id);
      // 乐观更新：移除卡片 + 计数 -1
      setList((prev) => prev.filter((x) => x.id !== u.id));
      setTotal((n) => Math.max(0, n - 1));
      showSuccess(t(`已取消关注 ${who}`, `Unfollowed ${who}`));
    } catch (e: any) {
      setError(e?.message || t('取消关注失败', 'Failed to unfollow'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-green-50 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
          <Users size={22} />
        </span>
        <div>
          <h2 className="text-lg font-black text-green-950">{t('我的关注', 'Following')}</h2>
          <p className="text-xs text-gray-400 font-medium">{total} {t('人', '')}</p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-medium">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12 text-gray-400">
          <Loader2 size={26} className="animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="py-12 text-center border-4 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/40">
          <Users size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-bold">{t('你还没关注任何人，去其他地方逛逛吧', 'You’re not following anyone yet — go explore')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((u) => {
            const isUrl = !!u.avatarUrl && /^https?:\/\//.test(u.avatarUrl);
            return (
              <div
                key={u.id}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-50/40 border border-green-50"
              >
                <button
                  onClick={() => goAuthor(u)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  <div className="w-12 h-12 rounded-full gradient-ningyuzhi shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                    {isUrl ? (
                      <img src={u.avatarUrl!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🌽</span>
                    )}
                  </div>
                  <span className="font-bold text-gray-800 truncate">
                    {u.nickname || t('玉米成员', 'Corn member')}
                  </span>
                </button>
                <button
                  onClick={() => navigate(`/messages/${u.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-green-700 border border-green-300 hover:bg-green-50 transition-colors shrink-0"
                >
                  <MessageCircle size={13} />
                  {t('私信', 'Message')}
                </button>
                <button
                  onClick={() => handleUnfollow(u)}
                  disabled={busyId === u.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-red-600 border border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                >
                  {busyId === u.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <UserMinus size={13} />
                  )}
                  {t('取关', 'Unfollow')}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

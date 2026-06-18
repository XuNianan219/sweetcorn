import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  type CommentItem as CommentData,
  type CommentSort,
  deleteComment,
  getComments,
  getReplies,
  toggleCommentLike,
} from '../../services/commentService';
import { useCurrentUser } from '../../contexts/UserContext';
import { CommentItem } from './CommentItem';
import { CommentInput } from './CommentInput';
import { CommentReplyList } from './CommentReplyList';
import { CommentListSkeleton } from '../skeletons/CommentSkeleton';

interface CommentSectionProps {
  postId: string;
}

const PAGE_SIZE = 20;

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { user, isAdmin } = useCurrentUser();
  const currentUserId = user?.id;

  const [comments, setComments] = useState<CommentData[]>([]);
  const [sort, setSort] = useState<CommentSort>('latest');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [replyLoadingId, setReplyLoadingId] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const reqId = useRef(0);

  const load = useCallback(
    async (nextSort: CommentSort, nextPage: number, replace: boolean) => {
      const id = ++reqId.current;
      if (replace) setLoading(true);
      else setLoadingMore(true);
      setError('');
      try {
        const res = await getComments(postId, nextSort, nextPage, PAGE_SIZE);
        if (id !== reqId.current) return;
        setComments((prev) => (replace ? res.comments : [...prev, ...res.comments]));
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(nextPage);
      } catch (e: any) {
        if (id === reqId.current) setError(e?.message || '加载失败');
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [postId],
  );

  useEffect(() => {
    setComments([]);
    load(sort, 1, true);
  }, [sort, load]);

  // 无限滚动
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          load(sort, page + 1, false);
        }
      },
      { rootMargin: '300px 0px' },
    );
    ob.observe(node);
    return () => ob.disconnect();
  }, [hasMore, loading, loadingMore, page, sort, load]);

  // 在 comments 树里按 id 更新某条评论（顶层或回复）
  const updateInTree = useCallback((id: string, updater: (c: CommentData) => CommentData) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === id) return updater(c);
        if (c.replies?.some((r) => r.id === id)) {
          return { ...c, replies: c.replies.map((r) => (r.id === id ? updater(r) : r)) };
        }
        return c;
      }),
    );
  }, []);

  const handleLike = useCallback(
    async (comment: CommentData) => {
      const wasLiked = comment.isLikedByMe;
      updateInTree(comment.id, (c) => ({
        ...c,
        isLikedByMe: !wasLiked,
        likeCount: c.likeCount + (wasLiked ? -1 : 1),
      }));
      try {
        const res = await toggleCommentLike(comment.id);
        updateInTree(comment.id, (c) => ({ ...c, isLikedByMe: res.liked, likeCount: res.likeCount }));
      } catch {
        updateInTree(comment.id, (c) => ({
          ...c,
          isLikedByMe: wasLiked,
          likeCount: c.likeCount + (wasLiked ? 1 : -1),
        }));
      }
    },
    [updateInTree],
  );

  const handleDelete = useCallback(
    async (comment: CommentData) => {
      if (!window.confirm('确定删除这条评论吗？')) return;
      try {
        await deleteComment(comment.id);
      } catch (e: any) {
        setError(e?.message || '删除失败');
        return;
      }
      // 顶层评论且有回复 → 占位；否则移除
      const isTop = !comment.parentId;
      if (isTop && comment.replyCount > 0) {
        updateInTree(comment.id, (c) => ({ ...c, isDeleted: true, content: '[该评论已删除]', author: null }));
      } else if (isTop) {
        setComments((prev) => prev.filter((c) => c.id !== comment.id));
        setTotal((t) => Math.max(0, t - 1));
      } else {
        // 回复：从父级 replies 移除
        setComments((prev) =>
          prev.map((c) =>
            c.id === comment.parentId
              ? { ...c, replies: c.replies.filter((r) => r.id !== comment.id), replyCount: Math.max(0, c.replyCount - 1) }
              : c,
          ),
        );
      }
    },
    [updateInTree],
  );

  const handleReplyClick = useCallback((comment: CommentData) => {
    // 回复始终挂在顶层父级下（最多 2 层）
    const topId = comment.parentId || comment.id;
    setReplyingTo((cur) => (cur === topId ? null : topId));
  }, []);

  const handleTopSuccess = useCallback((c: CommentData) => {
    setComments((prev) => [c, ...prev]);
    setTotal((t) => t + 1);
  }, []);

  const handleReplySuccess = useCallback((parentId: string, c: CommentData) => {
    setComments((prev) =>
      prev.map((top) =>
        top.id === parentId
          ? { ...top, replies: [...top.replies, c], replyCount: top.replyCount + 1 }
          : top,
      ),
    );
    setReplyingTo(null);
    setTotal((t) => t + 1);
  }, []);

  const handleExpand = useCallback(async (parent: CommentData) => {
    setReplyLoadingId(parent.id);
    try {
      const res = await getReplies(parent.id, 1, 50);
      setComments((prev) => prev.map((c) => (c.id === parent.id ? { ...c, replies: res.comments } : c)));
      setExpanded((s) => new Set(s).add(parent.id));
    } catch {
      /* ignore */
    } finally {
      setReplyLoadingId(null);
    }
  }, []);

  const handleCollapse = useCallback((parent: CommentData) => {
    setComments((prev) =>
      prev.map((c) => (c.id === parent.id ? { ...c, replies: c.replies.slice(0, 3) } : c)),
    );
    setExpanded((s) => {
      const n = new Set(s);
      n.delete(parent.id);
      return n;
    });
  }, []);

  return (
    <div className="space-y-4">
      {/* 标题 + 排序 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-green-950">评论 ({total})</h3>
        <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1">
          {(['latest', 'hot'] as CommentSort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                sort === s ? 'bg-white text-green-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {s === 'latest' ? '最新' : '最热'}
            </button>
          ))}
        </div>
      </div>

      {/* 顶层评论输入 */}
      <CommentInput postId={postId} placeholder="说点什么吧…" onSuccess={handleTopSuccess} />

      {error && <div className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-sm font-medium">{error}</div>}

      {/* 列表 */}
      {loading ? (
        <div className="py-2">
          <CommentListSkeleton count={3} />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-gray-400 font-medium">还没有评论，来说点什么吧</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {comments.map((c) => (
            <div key={c.id} className="py-1.5">
              <CommentItem
                comment={c}
                depth={0}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onLike={handleLike}
                onReply={handleReplyClick}
                onDelete={handleDelete}
              />

              <CommentReplyList
                parent={c}
                expanded={expanded.has(c.id)}
                loadingMore={replyLoadingId === c.id}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onLike={handleLike}
                onReply={handleReplyClick}
                onDelete={handleDelete}
                onExpand={handleExpand}
                onCollapse={handleCollapse}
              />

              {/* 回复输入框 */}
              {replyingTo === c.id && (
                <div className="ml-8 mt-2">
                  <CommentInput
                    postId={postId}
                    parentId={c.id}
                    autoFocus
                    placeholder={`回复 @${c.author?.nickname || '匿名玉米'}`}
                    onSuccess={(rc) => handleReplySuccess(c.id, rc)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
      {loadingMore && (
        <div className="flex justify-center py-3 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
        </div>
      )}
    </div>
  );
};
